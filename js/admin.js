import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";

const conteudo = document.getElementById("adminConteudo");
const carregando = document.getElementById("carregando");
const feedback = document.getElementById("feedbackAdmin");

function celula(texto) {
  const td = document.createElement("td");
  td.textContent = texto ?? "—";
  return td;
}

function botaoStatus(texto, acao) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.textContent = texto;
  botao.className = "botao-tabela";
  botao.addEventListener("click", acao);
  return botao;
}

async function carregarTabela(colecaoNome, tbodyId, render) {
  const snapshot = await getDocs(query(collection(db, colecaoNome), orderBy("criadoEm", "desc")));
  const tbody = document.getElementById(tbodyId);
  tbody.replaceChildren();
  snapshot.docs.forEach((documento) => tbody.appendChild(render(documento)));
  return snapshot.size;
}

async function carregarAdmin() {
  const [alunos, agendamentos, contatos] = await Promise.all([
    getDocs(collection(db, "usuarios")),
    carregarTabela("agendamentos", "agendamentosAdmin", (documento) => {
      const dados = documento.data();
      const tr = document.createElement("tr");
      tr.append(celula(dados.nome), celula(dados.data), celula(dados.plano), celula(dados.status));
      const acoes = document.createElement("td");
      acoes.append(
        botaoStatus("Confirmar", async () => { await updateDoc(doc(db, "agendamentos", documento.id), { status: "confirmado", atualizadoEm: serverTimestamp() }); await carregarAdmin(); }),
        botaoStatus("Cancelar", async () => { await updateDoc(doc(db, "agendamentos", documento.id), { status: "cancelado", atualizadoEm: serverTimestamp() }); await carregarAdmin(); })
      );
      tr.append(acoes);
      return tr;
    }),
    carregarTabela("contatos", "contatosAdmin", (documento) => {
      const dados = documento.data();
      const tr = document.createElement("tr");
      tr.append(celula(dados.nome), celula(dados.email), celula(dados.mensagem), celula(dados.status));
      const acoes = document.createElement("td");
      acoes.append(botaoStatus("Marcar respondido", async () => { await updateDoc(doc(db, "contatos", documento.id), { status: "respondido" }); await carregarAdmin(); }));
      tr.append(acoes);
      return tr;
    })
  ]);

  const tbodyAlunos = document.getElementById("alunosAdmin");
  tbodyAlunos.replaceChildren();
  alunos.docs.forEach((documento) => {
    const dados = documento.data();
    const tr = document.createElement("tr");
    tr.append(celula(dados.nome), celula(dados.email), celula(dados.telefone));
    tbodyAlunos.appendChild(tr);
  });

  document.getElementById("totalAlunos").textContent = alunos.size;
  document.getElementById("totalAgendamentos").textContent = agendamentos;
  document.getElementById("totalContatos").textContent = contatos;
  await Promise.all(["planos", "professores", "horarios"].map(carregarConteudo));
}

async function carregarConteudo(nomeColecao) {
  const snapshot = await getDocs(collection(db, nomeColecao));
  const alvo = document.getElementById(`lista${nomeColecao[0].toUpperCase() + nomeColecao.slice(1)}Admin`);
  alvo.replaceChildren();
  snapshot.docs.forEach((documento) => {
    const dados = documento.data();
    const item = document.createElement("p");
    item.className = "item-resumo";
    item.textContent = nomeColecao === "planos" ? `${dados.nome} — R$ ${Number(dados.valor).toFixed(2)}` : nomeColecao === "professores" ? `${dados.nome} — ${dados.especialidade}` : `${dados.hora} — ${dados.atividade}`;
    alvo.appendChild(item);
  });
}

async function salvarConteudo(colecaoNome, dados, form) {
  await addDoc(collection(db, colecaoNome), { ...dados, ativo: true, criadoEm: serverTimestamp() });
  form.reset();
  feedback.textContent = "Conteúdo salvo.";
  feedback.className = "mensagem sucesso";
  await carregarConteudo(colecaoNome);
}

document.getElementById("planoForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await salvarConteudo("planos", { nome: document.getElementById("planoNomeAdmin").value.trim(), valor: Number(document.getElementById("planoValorAdmin").value), beneficios: document.getElementById("planoBeneficiosAdmin").value.split(",").map((v) => v.trim()).filter(Boolean) }, event.currentTarget);
});
document.getElementById("professorForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await salvarConteudo("professores", { nome: document.getElementById("professorNomeAdmin").value.trim(), especialidade: document.getElementById("professorEspecialidadeAdmin").value.trim() }, event.currentTarget);
});
document.getElementById("horarioForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await salvarConteudo("horarios", { hora: document.getElementById("horarioHoraAdmin").value, atividade: document.getElementById("horarioAtividadeAdmin").value.trim() }, event.currentTarget);
});

onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) { window.location.href = "login.html"; return; }
  try {
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
