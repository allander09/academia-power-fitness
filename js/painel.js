import { onAuthStateChanged, reload, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";

const conteudo = document.getElementById("conteudoPainel");
const carregando = document.getElementById("carregando");
const feedback = document.getElementById("feedbackPerfil");
let usuarioAtual;

function formatarData(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toLocaleString("pt-BR") : "Data pendente";
}

function renderizarAgendamentos(documentos) {
  const lista = document.getElementById("listaAgendamentos");
  if (!documentos.length) {
    lista.innerHTML = '<p class="lista-vazia">Você ainda não possui agendamentos.</p>';
    return;
  }

  lista.innerHTML = documentos.map((item) => {
    const dados = item.data();
    return `<article class="item-lista"><strong>${dados.data}</strong><span>Plano: ${dados.plano || "Não informado"}</span><span>Status: ${dados.status}</span><small>Criado em ${formatarData(dados.criadoEm)}</small></article>`;
  }).join("");
}

async function carregarPainel(usuario) {
  usuarioAtual = usuario;
  const perfilRef = doc(db, "usuarios", usuario.uid);
  const perfilSnap = await getDoc(perfilRef);

  if (perfilSnap.exists()) {
    const perfil = perfilSnap.data();
    document.getElementById("saudacao").textContent = `Olá, ${perfil.nome.split(" ")[0]}!`;
    document.getElementById("perfilNome").value = perfil.nome || "";
    document.getElementById("perfilTelefone").value = perfil.telefone || "";
  }
  document.getElementById("perfilEmail").value = usuario.email || "";

  const status = document.getElementById("emailVerificado");
  status.textContent = usuario.emailVerified ? "E-mail verificado" : "E-mail ainda não verificado";
  status.className = `status ${usuario.emailVerified ? "verificado" : "pendente"}`;
  document.getElementById("reenviarVerificacao").hidden = usuario.emailVerified;

  const consulta = query(collection(db, "agendamentos"), where("usuarioId", "==", usuario.uid), orderBy("criadoEm", "desc"));
  const agendamentos = await getDocs(consulta);
  renderizarAgendamentos(agendamentos.docs);

  carregando.hidden = true;
  conteudo.hidden = false;
}

onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    window.location.href = "login.html";
    return;
  }
  try {
    await carregarPainel(usuario);
  } catch (error) {
    carregando.textContent = "Não foi possível carregar seus dados.";
    console.error(error);
  }
});

document.getElementById("perfilForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await updateDoc(doc(db, "usuarios", usuarioAtual.uid), {
      nome: document.getElementById("perfilNome").value.trim(),
      telefone: document.getElementById("perfilTelefone").value.trim(),
      atualizadoEm: serverTimestamp()
    });
    feedback.textContent = "Perfil atualizado.";
    feedback.className = "mensagem sucesso";
  } catch {
    feedback.textContent = "Não foi possível atualizar o perfil.";
    feedback.className = "mensagem erro";
  }
});

document.getElementById("reenviarVerificacao").addEventListener("click", async () => {
  try {
    await reload(usuarioAtual);
    if (usuarioAtual.emailVerified) {
      window.location.reload();
      return;
    }
    await sendEmailVerification(usuarioAtual);
    alert("E-mail de verificação reenviado.");
  } catch {
    alert("Não foi possível reenviar agora.");
  }
});

document.getElementById("sair").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
