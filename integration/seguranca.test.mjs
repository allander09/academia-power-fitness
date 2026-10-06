import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { criarServico } from "../functions/service.mjs";

const require = createRequire(new URL("../functions/package.json", import.meta.url));
const { initializeApp, deleteApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const projectId = "demo-power-fitness";
let ambiente, app, db, auth, servico;
class Erro extends Error { constructor(code, message) { super(message); this.code = code; } }
const request = (uid, data = {}, verificado = true) => ({ auth: { uid, token: { email: `${uid}@example.com`, email_verified: verificado } }, data });
const cliente = (uid, verificado = true) => ambiente.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: verificado }).firestore();
const rejeita = (promise, code) => assert.rejects(promise, error => error.code === code);
const agendar = uid => servico.solicitarAgendamento(request(uid, { data: "2026-10-05", horarioId: "atividade", plano: "Essencial" }));
const confirmar = id => servico.alterarAgendamento(request("admin", { id, status: "confirmado" }));

before(async () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST, "Execute pelo Firebase Emulator Suite, nunca em produção.");
  ambiente = await initializeTestEnvironment({ projectId, firestore: { rules: readFileSync("firestore.rules", "utf8") } });
  app = initializeApp({ projectId }, "testes-power-fitness");
  db = getFirestore(app); auth = getAuth(app);
  servico = criarServico({ db, auth, FieldValue, Timestamp, Erro, agora: () => new Date("2026-10-04T12:00:00-03:00") });
});
beforeEach(async () => {
  await ambiente.clearFirestore();
  const contas = await auth.listUsers();
  if (contas.users.length) await auth.deleteUsers(contas.users.map(item => item.uid));
  for (const uid of ["admin", "aluno1", "aluno2", "aluno3", "professor", "outroprofessor", "naoverificado"]) {
    await auth.createUser({ uid, email: `${uid}@example.com`, emailVerified: uid !== "naoverificado" });
    await db.collection("usuarios").doc(uid).set({ nome: `Nome ${uid}`, email: `${uid}@example.com`, telefone: "85999999999", papel: "aluno" });
  }
  await db.doc("admins/admin").set({ ativo: true });
  await db.doc("planos/essencial").set({ nome: "Essencial", ativo: true, valor: 129.9 });
  for (const uid of ["professor", "outroprofessor"]) await db.collection("professores_acesso").doc(uid).set({ ativo: true, nome: `Nome ${uid}` });
  await db.doc("horarios/atividade").set({ hora: "10:00", atividade: "Funcional", diasSemana: [1], capacidade: 1, ativo: true, professorUid: "professor", professorNome: "Nome professor" });
});
after(async () => { if (ambiente) await ambiente.cleanup(); if (app) await deleteApp(app); });

test("reservas recusam plano inventado ou desativado e aceitam interesse ainda não definido", async () => {
  const dados = { data: "2026-10-05", horarioId: "atividade", plano: "Inventado" };
  await rejeita(servico.solicitarAgendamento(request("aluno1", dados)), "failed-precondition");
  await db.doc("planos/essencial").update({ ativo: false });
  await rejeita(agendar("aluno1"), "failed-precondition");
  const reserva = await servico.solicitarAgendamento(request("aluno1", { ...dados, plano: "Ainda não decidi" }));
  assert.equal(reserva.status, "pendente");
  assert.equal((await db.doc(`agendamentos/${reserva.id}`).get()).data().plano, "Ainda não decidi");
});

test("as regras isolam alunos e não entregam o documento completo ao professor", async () => {
  const { id } = await agendar("aluno1");
  await assertSucceeds(getDoc(doc(cliente("aluno1"), "agendamentos", id)));
  await assertSucceeds(getDoc(doc(cliente("admin"), "agendamentos", id)));
  await assertFails(getDoc(doc(cliente("aluno2"), "agendamentos", id)));
  await assertFails(getDoc(doc(cliente("professor"), "agendamentos", id)));
});

test("o navegador não pode forjar confirmação, presença ou um novo agendamento", async () => {
  const { id } = await agendar("aluno1");
  await assertFails(updateDoc(doc(cliente("admin"), "agendamentos", id), { status: "confirmado" }));
  await assertFails(updateDoc(doc(cliente("professor"), "agendamentos", id), { presenca: "presente" }));
  await assertFails(setDoc(doc(cliente("aluno1"), "agendamentos", "forjado"), { usuarioId: "aluno1", status: "confirmado" }));
  await assertFails(setDoc(doc(cliente("aluno1"), "admins", "aluno1"), { ativo: true }));
});

test("perfil permite correção, impede privilégios e preserva a ciência de privacidade", async () => {
  await assertSucceeds(updateDoc(doc(cliente("aluno1"), "usuarios", "aluno1"), { nome: "Nome corrigido", atualizadoEm: serverTimestamp() }));
  await assertFails(updateDoc(doc(cliente("aluno1"), "usuarios", "aluno1"), { papel: "admin", atualizadoEm: serverTimestamp() }));
  await assertFails(updateDoc(doc(cliente("aluno1"), "usuarios", "aluno1"), { privacidadeVersao: "alterada", atualizadoEm: serverTimestamp() }));
  await assertSucceeds(getDoc(doc(cliente("naoverificado", false), "professores_acesso", "naoverificado")));
});

test("cadastro exige a versão e o horário de ciência, inclusive antes de verificar e-mail", async () => {
  const dados = { nome: "Conta nova", email: "nova@example.com", telefone: "85999999999", papel: "aluno", criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp(), privacidadeVersao: "2026-10-04", privacidadeCienteEm: serverTimestamp() };
  await assertSucceeds(setDoc(doc(cliente("nova", false), "usuarios", "nova"), dados));
  await assertFails(setDoc(doc(cliente("outra", false), "usuarios", "outra"), { ...dados, email: "outra@example.com", privacidadeVersao: "antiga" }));
});

test("funções recusam conta não verificada e confirmação por aluno", async () => {
  await rejeita(servico.solicitarAgendamento(request("naoverificado", { data: "2026-10-05", horarioId: "atividade", plano: "Essencial" }, false)), "failed-precondition");
  const { id } = await agendar("aluno1");
  await rejeita(servico.alterarAgendamento(request("aluno1", { id, status: "confirmado" })), "permission-denied");
});

test("duas solicitações simultâneas do mesmo aluno geram só um registro", async () => {
  const resultados = await Promise.allSettled([agendar("aluno1"), agendar("aluno1")]);
  assert.equal(resultados.filter(item => item.status === "fulfilled").length, 1);
  assert.equal((await db.collection("agendamentos").get()).size, 1);
});

test("confirmações concorrentes respeitam capacidade e cancelamento promove a fila", async () => {
  const agendamentos = await Promise.all(["aluno1", "aluno2", "aluno3"].map(agendar));
  await Promise.all(agendamentos.map(item => confirmar(item.id)));
  let documentos = (await db.collection("agendamentos").get()).docs;
  assert.equal(documentos.filter(item => item.data().status === "confirmado").length, 1);
  assert.equal(documentos.filter(item => item.data().status === "lista_espera").length, 2);
  const confirmado = documentos.find(item => item.data().status === "confirmado");
  const retorno = await servico.alterarAgendamento(request(confirmado.data().usuarioId, { id: confirmado.id, status: "cancelado" }));
  assert.equal(retorno.promoveu, true);
  documentos = (await db.collection("agendamentos").get()).docs;
  assert.equal(documentos.filter(item => item.data().status === "pendente").length, 1);
});

test("o professor recebe identificador aleatório, registra presença e não acessa outra turma", async () => {
  const { id } = await agendar("aluno1"); await confirmar(id);
  const resultado = await servico.listarAulasProfessor(request("professor"));
  assert.equal(resultado.aulas.length, 1); assert.equal(resultado.totalAlunos, 1);
  assert.deepEqual(Object.keys(resultado.aulas[0]).sort(), ["aulaId", "nome", "data", "hora", "atividade", "status", "presenca"].sort());
  assert.ok(!JSON.stringify(resultado).includes("aluno1_"));
  assert.equal((await servico.listarAulasProfessor(request("outroprofessor"))).aulas.length, 0);
  await rejeita(servico.alterarAgendamento(request("outroprofessor", { aulaId: resultado.aulas[0].aulaId, presenca: "presente" })), "permission-denied");
  await servico.alterarAgendamento(request("professor", { aulaId: resultado.aulas[0].aulaId, presenca: "presente" }));
  assert.equal((await db.doc(`agendamentos/${id}`).get()).data().presenca, "presente");
});

test("troca de professor sincroniza a turma e alteração de hora com reserva é recusada", async () => {
  const { id } = await agendar("aluno1"); await confirmar(id);
  await servico.salvarHorario(request("admin", { id: "atividade", dados: { professorUid: "outroprofessor" } }));
  assert.equal((await servico.listarAulasProfessor(request("professor"))).aulas.length, 0);
  assert.equal((await servico.listarAulasProfessor(request("outroprofessor"))).aulas.length, 1);
  await rejeita(servico.salvarHorario(request("admin", { id: "atividade", dados: { hora: "11:00" } })), "failed-precondition");
});

test("exportação inclui contatos e pedidos da própria conta", async () => {
  await agendar("aluno1");
  await db.doc("contatos/meu").set({ usuarioId: "aluno1", mensagem: "Meu contato" });
  await db.doc("contatos/outro").set({ usuarioId: "aluno2", mensagem: "Contato privado" });
  await db.doc("solicitacoes_privacidade/aluno1").set({ usuarioId: "aluno1", status: "pendente" });
  const exportacao = await servico.exportarDados(request("aluno1"));
  assert.equal(exportacao.contatos.length, 1); assert.equal(exportacao.agendamentos.length, 1);
  assert.equal(exportacao.solicitacaoPrivacidade.status, "pendente");
  assert.ok(!JSON.stringify(exportacao).includes("Contato privado"));
});

test("pedido de exclusão não pode ser marcado atendido sem executar no servidor", async () => {
  const dados = { usuarioId: "aluno1", email: "aluno1@example.com", tipo: "exclusao", status: "pendente", criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() };
  await assertSucceeds(setDoc(doc(cliente("aluno1"), "solicitacoes_privacidade", "aluno1"), dados));
  await assertFails(updateDoc(doc(cliente("admin"), "solicitacoes_privacidade", "aluno1"), { status: "atendida", atualizadoEm: serverTimestamp() }));
});

test("exclusão remove conta, perfil, mensagens e reservas; sessão antiga fica bloqueada", async () => {
  const { id } = await agendar("aluno1"); await confirmar(id);
  await db.doc("contatos/contato").set({ usuarioId: "aluno1", email: "aluno1@example.com", mensagem: "Exclusão" });
  await db.doc("contatos/anonimo").set({ usuarioId: null, email: "aluno1@example.com", mensagem: "Anterior" });
  await db.doc("solicitacoes_privacidade/aluno1").set({ usuarioId: "aluno1", email: "aluno1@example.com", status: "pendente" });
  const retorno = await servico.excluirConta(request("admin", { usuarioId: "aluno1", confirmacao: "EXCLUIR" }));
  assert.ok(retorno.protocolo);
  assert.ok((await db.doc("exclusoes/aluno1").get()).data().expiraEm.toMillis() > Date.parse("2026-10-04T12:00:00-03:00"));
  await assert.rejects(auth.getUser("aluno1"), error => error.code === "auth/user-not-found");
  assert.equal((await db.doc("usuarios/aluno1").get()).exists, false);
  assert.equal((await db.doc(`agendamentos/${id}`).get()).exists, false);
  assert.equal((await db.collection("contatos").get()).size, 0);
  await assertFails(setDoc(doc(cliente("aluno1"), "usuarios", "aluno1"), { nome: "Recriada" }));
});

test("admin ativo e professor ativo precisam ter seus acessos revogados antes da exclusão", async () => {
  await db.doc("solicitacoes_privacidade/professor").set({ status: "pendente", email: "professor@example.com" });
  await rejeita(servico.excluirConta(request("admin", { usuarioId: "professor", confirmacao: "EXCLUIR" })), "failed-precondition");
  await rejeita(servico.excluirConta(request("admin", { usuarioId: "admin", confirmacao: "EXCLUIR" })), "failed-precondition");
});

test("uma exclusão interrompida pode ser retomada sem marcar uma conclusão falsa", async () => {
  await agendar("aluno1");
  await db.doc("solicitacoes_privacidade/aluno1").set({ status: "pendente", email: "aluno1@example.com" });
  const authComFalha = {
    getUser: auth.getUser.bind(auth), updateUser: auth.updateUser.bind(auth), revokeRefreshTokens: auth.revokeRefreshTokens.bind(auth),
    deleteUser: async () => { throw new Error("Falha temporária de exclusão"); }
  };
  const interrompido = criarServico({ db, auth: authComFalha, FieldValue, Timestamp, Erro });
  const pedido = request("admin", { usuarioId: "aluno1", confirmacao: "EXCLUIR" });
  await assert.rejects(interrompido.excluirConta(pedido), /Falha temporária/);
  assert.equal((await db.doc("solicitacoes_privacidade/aluno1").get()).data().status, "processando");
  assert.equal((await db.doc("exclusoes/aluno1").get()).data().expiraEm, undefined);
  assert.equal((await auth.getUser("aluno1")).disabled, true);
  await servico.excluirConta(pedido);
  assert.equal((await db.doc("solicitacoes_privacidade/aluno1").get()).exists, false);
  await assert.rejects(auth.getUser("aluno1"), error => error.code === "auth/user-not-found");
});

test("atividades na mesma hora têm capacidades separadas", async () => {
  await db.doc("horarios/outraatividade").set({ hora: "10:00", atividade: "Musculação", diasSemana: [1], capacidade: 1, ativo: true });
  const primeira = await agendar("aluno1");
  const segunda = await servico.solicitarAgendamento(request("aluno2", { data: "2026-10-05", horarioId: "outraatividade", plano: "Essencial" }));
  await Promise.all([confirmar(primeira.id), confirmar(segunda.id)]);
  const reservas = (await db.collection("agendamentos").get()).docs;
  assert.equal(reservas.filter(item => item.data().status === "confirmado").length, 2);
});

test("reduzir capacidade abaixo da ocupação e usar acesso revogado é recusado", async () => {
  await servico.salvarHorario(request("admin", { id: "atividade", dados: { capacidade: 2 } }));
  const reservas = await Promise.all([agendar("aluno1"), agendar("aluno2")]);
  await Promise.all(reservas.map(item => confirmar(item.id)));
  await rejeita(servico.salvarHorario(request("admin", { id: "atividade", dados: { capacidade: 1 } })), "failed-precondition");
  await db.doc("professores_acesso/professor").update({ ativo: false });
  await rejeita(servico.listarAulasProfessor(request("professor")), "permission-denied");
});
