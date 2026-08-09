import { getIdToken, onAuthStateChanged, reload, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";
import { normalizarBusca } from "./validacoes.mjs";

const conteudo = document.getElementById("adminConteudo");
const carregando = document.getElementById("carregando");
const feedback = document.getElementById("feedbackAdmin");
let alunosCache = [];

function mostrarFeedback(mensagem, tipo = "sucesso") {
  feedback.textContent = mensagem;
  feedback.className = `mensagem ${tipo}`;
}

function celula(texto) {
  const td = document.createElement("td");
  td.textContent = texto ?? "—";
  return td;
}

async function executarAcao(botao, acao, mensagem = "Alteração salva.") {
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = "Aguarde...";
  try {
    await acao();
    mostrarFeedback(mensagem);
  } catch (error) {
    mostrarFeedback("Não foi possível concluir a operação.", "erro");
    console.error(error);
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
}

function botaoAcao(texto, acao, mensagem) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.textContent = texto;
  botao.className = "botao-tabela";
  botao.addEventListener("click", () => executarAcao(botao, acao, mensagem));
  return botao;
}

async function carregarTabela(colecaoNome, tbodyId, render) {
  const snapshot = await getDocs(query(collection(db, colecaoNome), orderBy("criadoEm", "desc")));
  const tbody = document.getElementById(tbodyId);
  tbody.replaceChildren();
  snapshot.docs.forEach((documento) => tbody.appendChild(render(documento)));
  return snapshot.size;
}

function renderizarAlunos(termo = "") {
  const busca = normalizarBusca(termo);
  const tbody = document.getElementById("alunosAdmin");
  tbody.replaceChildren();

  alunosCache
    .filter(({ dados }) => normalizarBusca(`${dados.nome} ${dados.email} ${dados.telefone}`).includes(busca))
    .forEach(({ dados }) => {
      const tr = document.createElement("tr");
      tr.append(celula(dados.nome), celula(dados.email), celula(dados.telefone));
      tbody.appendChild(tr);
    });
}

function resumoConteudo(nomeColecao, dados) {
  if (nomeColecao === "planos") return `${dados.nome} — R$ ${Number(dados.valor).toFixed(2)}`;
  if (nomeColecao === "professores") return `${dados.nome} — ${dados.especialidade}`;
  return `${dados.hora} — ${dados.atividade}`;
}

async function editarConteudo(nomeColecao, documento) {
  const dados = documento.data();
  const referencia = doc(db, nomeColecao, documento.id);

  if (nomeColecao === "planos") {
    const nome = prompt("Nome do plano", dados.nome);
    if (nome === null) return;
    const valorInformado = prompt("Valor mensal", dados.valor);
    if (valorInformado === null) return;
    const valor = Number(valorInformado.replace(",", "."));
    const beneficios = prompt("Benefícios separados por vírgulas", (dados.beneficios || []).join(", "));
    if (beneficios === null || !nome.trim() || !Number.isFinite(valor) || valor < 0) throw new Error("Dados inválidos.");
    await updateDoc(referencia, {
      nome: nome.trim(),
      valor,
      beneficios: beneficios.split(",").map((item) => item.trim()).filter(Boolean),
      atualizadoEm: serverTimestamp()
    });
  } else if (nomeColecao === "professores") {
    const nome = prompt("Nome do professor", dados.nome);
    if (nome === null) return;
    const especialidade = prompt("Especialidade", dados.especialidade);
    if (especialidade === null) return;
    const fotoUrl = prompt("URL da foto (deixe vazio para usar as iniciais)", dados.fotoUrl || "");
    if (fotoUrl === null || !nome.trim() || !especialidade.trim()) throw new Error("Dados inválidos.");
    await updateDoc(referencia, { nome: nome.trim(), especialidade: especialidade.trim(), fotoUrl: fotoUrl.trim(), atualizadoEm: serverTimestamp() });
  } else {
    const hora = prompt("Horário no formato HH:MM", dados.hora);
    if (hora === null) return;
    const atividade = prompt("Atividade", dados.atividade);
    if (atividade === null || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora) || !atividade.trim()) throw new Error("Dados inválidos.");
    await updateDoc(referencia, { hora, atividade: atividade.trim(), atualizadoEm: serverTimestamp() });
  }

  await carregarConteudo(nomeColecao);
}

async function carregarConteudo(nomeColecao) {
  const snapshot = await getDocs(collection(db, nomeColecao));
  const alvo = document.getElementById(`lista${nomeColecao[0].toUpperCase() + nomeColecao.slice(1)}Admin`);
  alvo.replaceChildren();

  snapshot.docs.forEach((documento) => {
    const dados = documento.data();
    const ativo = dados.ativo !== false;
    const item = document.createElement("article");
    item.className = "item-resumo item-admin-conteudo";

    const texto = document.createElement("span");
    texto.textContent = `${resumoConteudo(nomeColecao, dados)} — ${ativo ? "Ativo" : "Inativo"}`;

    const acoes = document.createElement("div");
    acoes.className = "acoes-admin";
    acoes.append(
      botaoAcao("Editar", () => editarConteudo(nomeColecao, documento), "Conteúdo atualizado."),
      botaoAcao(ativo ? "Desativar" : "Reativar", async () => {
        await updateDoc(doc(db, nomeColecao, documento.id), { ativo: !ativo, atualizadoEm: serverTimestamp() });
        await carregarConteudo(nomeColecao);
      }, ativo ? "Conteúdo desativado." : "Conteúdo reativado.")
    );

    item.append(texto, acoes);
    alvo.appendChild(item);
  });
}

async function carregarAdmin() {
  const [alunos, agendamentos, contatos] = await Promise.all([
    getDocs(collection(db, "usuarios")),
    carregarTabela("agendamentos", "agendamentosAdmin", (documento) => {
      const dados = documento.data();
      const tr = document.createElement("tr");
      tr.append(celula(dados.nome), celula(dados.data), celula(dados.hora), celula(dados.plano), celula(dados.status));
      const acoes = document.createElement("td");
      acoes.append(
        botaoAcao("Confirmar", async () => {
          await updateDoc(doc(db, "agendamentos", documento.id), { status: "confirmado", atualizadoEm: serverTimestamp() });
          await carregarAdmin();
        }, "Agendamento confirmado."),
        botaoAcao("Cancelar", async () => {
          await updateDoc(doc(db, "agendamentos", documento.id), { status: "cancelado", atualizadoEm: serverTimestamp() });
          await carregarAdmin();
        }, "Agendamento cancelado.")
      );
      tr.append(acoes);
      return tr;
    }),
    carregarTabela("contatos", "contatosAdmin", (documento) => {
      const dados = documento.data();
      const tr = document.createElement("tr");
      tr.append(celula(dados.nome), celula(dados.email), celula(dados.mensagem), celula(dados.status));
      const acoes = document.createElement("td");
      acoes.append(botaoAcao("Marcar respondido", async () => {
        await updateDoc(doc(db, "contatos", documento.id), { status: "respondido", atualizadoEm: serverTimestamp() });
        await carregarAdmin();
      }, "Contato marcado como respondido."));
      tr.append(acoes);
      return tr;
    })
  ]);

  alunosCache = alunos.docs.map((documento) => ({ id: documento.id, dados: documento.data() }));
  renderizarAlunos(document.getElementById("buscaAlunos").value);
  document.getElementById("totalAlunos").textContent = alunos.size;
  document.getElementById("totalAgendamentos").textContent = agendamentos;
  document.getElementById("totalContatos").textContent = contatos;
  await Promise.all(["planos", "professores", "horarios"].map(carregarConteudo));
}

async function salvarConteudo(colecaoNome, dados, form) {
  const botao = form.querySelector('button[type="submit"]');
  await executarAcao(botao, async () => {
    await addDoc(collection(db, colecaoNome), { ...dados, ativo: true, criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() });
    form.reset();
    await carregarConteudo(colecaoNome);
  }, "Conteúdo salvo.");
}

document.getElementById("planoForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await salvarConteudo("planos", {
    nome: document.getElementById("planoNomeAdmin").value.trim(),
    valor: Number(document.getElementById("planoValorAdmin").value),
    beneficios: document.getElementById("planoBeneficiosAdmin").value.split(",").map((valor) => valor.trim()).filter(Boolean)
  }, event.currentTarget);
});

document.getElementById("professorForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await salvarConteudo("professores", {
    nome: document.getElementById("professorNomeAdmin").value.trim(),
    especialidade: document.getElementById("professorEspecialidadeAdmin").value.trim(),
    fotoUrl: document.getElementById("professorFotoAdmin").value.trim()
  }, event.currentTarget);
});

document.getElementById("horarioForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await salvarConteudo("horarios", {
    hora: document.getElementById("horarioHoraAdmin").value,
    atividade: document.getElementById("horarioAtividadeAdmin").value.trim()
  }, event.currentTarget);
});

document.getElementById("buscaAlunos").addEventListener("input", (event) => renderizarAlunos(event.target.value));

onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    window.location.href = "login.html";
    return;
  }

  try {
    await reload(usuario);
    if (!usuario.emailVerified) {
      carregando.textContent = "Verifique o e-mail desta conta antes de acessar a administração.";
      return;
    }
    await getIdToken(usuario, true);

    const admin = await getDoc(doc(db, "admins", usuario.uid));
    if (!admin.exists()) {
      carregando.textContent = "Acesso negado: esta conta não é administradora.";
      return;
    }
    await carregarAdmin();
    carregando.hidden = true;
    conteudo.hidden = false;
  } catch (error) {
    carregando.textContent = "Não foi possível carregar o painel.";
    console.error(error);
  }
});

document.getElementById("sair").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
