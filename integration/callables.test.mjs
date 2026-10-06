import { before, test } from "node:test";
import assert from "node:assert/strict";
import { criarDadosDemo, SENHA_DEMO } from "../scripts/dados-demo.mjs";

let data, tokens = {};
async function chamar(nome, dados = {}, perfil) {
  const resposta = await fetch(`http://127.0.0.1:5001/demo-power-fitness/southamerica-east1/${nome}`, {
    method: "POST", headers: { "Content-Type": "application/json", ...(perfil ? { Authorization: `Bearer ${tokens[perfil]}` } : {}) },
    body: JSON.stringify({ data: dados })
  });
  return { status: resposta.status, ...(await resposta.json()) };
}

before(async () => {
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099", "Use somente os emuladores locais.");
  ({ data } = await criarDadosDemo());
  for (const perfil of ["admin", "professor", "aluno", "aluno2", "novo"]) {
    const resposta = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-power-fitness", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: `${perfil}@example.com`, password: SENHA_DEMO, returnSecureToken: true })
    });
    assert.equal(resposta.status, 200);
    tokens[perfil] = (await resposta.json()).idToken;
  }
});

test("HTTP callable exige autenticação e conta verificada", async () => {
  assert.equal((await chamar("exportarDados")).error.status, "UNAUTHENTICATED");
  assert.equal((await chamar("exportarDados", {}, "novo")).error.status, "FAILED_PRECONDITION");
  assert.equal((await chamar("listarAulasProfessor", {}, "aluno")).error.status, "PERMISSION_DENIED");
});

test("Hosting preserva a navegação e os recursos a partir da página inicial", async () => {
  for (const entrada of ["/", "/html/", "/html/index.html"]) {
    const resposta = await fetch(`http://127.0.0.1:5000${entrada}`);
    assert.equal(resposta.status, 200);
    for (const caminho of ["login.html", "formularios.html", "privacidade.html", "../js/firebase-services.js", "../css/style.css"]) {
      const url = new URL(caminho, resposta.url);
      assert.equal((await fetch(url)).status, 200, `${entrada} resolve ${caminho} em ${url}`);
    }
  }
});

test("HTTP mantém a capacidade, libera presença e promove a fila", async () => {
  const id = `demo-aluno_${data}_10:00`;
  const tentativaAluno = await chamar("alterarAgendamento", { id, status: "confirmado" }, "aluno");
  assert.equal(tentativaAluno.error.status, "PERMISSION_DENIED");
  assert.equal((await chamar("alterarAgendamento", { id, status: "confirmado" }, "admin")).result.status, "lista_espera");
  const professor = (await chamar("listarAulasProfessor", {}, "professor")).result;
  const aula = professor.aulas.find(item => item.status === "confirmado");
  assert.ok(aula);
  assert.deepEqual(Object.keys(aula).sort(), ["aulaId", "nome", "data", "hora", "atividade", "status", "presenca"].sort());
  assert.equal((await chamar("alterarAgendamento", { aulaId: aula.aulaId, presenca: "presente" }, "professor")).result.presenca, "presente");
  assert.equal((await chamar("alterarAgendamento", { id: `demo-aluno2_${data}_10:00`, status: "cancelado" }, "aluno2")).result.promoveu, true);
  assert.equal((await chamar("alterarAgendamento", { id, status: "confirmado" }, "admin")).result.status, "confirmado");
});

test("HTTP cria reserva e exporta somente os dados da própria conta", async () => {
  const disponibilidade = await chamar("listarDisponibilidadeAgendamento", { data }, "aluno");
  assert.equal(disponibilidade.status, 200);
  const musculacao = disponibilidade.result.horarios.find(item => item.id === "musculacao");
  assert.equal(musculacao.professorUid, "demo-professor");
  assert.equal(musculacao.disponivel, true);
  const reserva = await chamar("solicitarAgendamento", { data, horarioId: "musculacao", professorUid: "demo-professor", plano: "Essencial" }, "aluno");
  assert.equal(reserva.status, 200);
  assert.equal(reserva.result.status, "pendente");
  assert.equal((await chamar("solicitarAgendamento", { data, horarioId: "musculacao", professorUid: "demo-professor", plano: "Essencial" }, "aluno")).error.status, "ALREADY_EXISTS");
  assert.equal((await chamar("solicitarAgendamento", { data, horarioId: "musculacao", professorUid: "professor-inventado", plano: "Essencial" }, "aluno2")).error.status, "FAILED_PRECONDITION");
  const exportacao = (await chamar("exportarDados", {}, "aluno")).result;
  assert.equal(exportacao.agendamentos.length, 2);
  assert.ok(!JSON.stringify(exportacao).includes("aluno2@example.com"));
});

test("HTTP permite administrar atividade e recusa professor", async () => {
  const dados = { hora: "12:00", atividade: "Pilates", capacidade: 8, diasSemana: [1, 2, 3, 4, 5], ativo: true, professorUid: "demo-professor" };
  assert.equal((await chamar("salvarHorario", { dados }, "professor")).error.status, "PERMISSION_DENIED");
  const retorno = await chamar("salvarHorario", { dados }, "admin");
  assert.equal(retorno.status, 200);
  assert.ok(retorno.result.id);
});
