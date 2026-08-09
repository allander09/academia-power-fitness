import { onAuthStateChanged, reload, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";

const conteudo = document.getElementById("conteudoPainel");
const carregando = document.getElementById("carregando");
const feedback = document.getElementById("feedbackPerfil");
let usuarioAtual;

function criar(tag, texto, classe) {
  const elemento = document.createElement(tag);
  elemento.textContent = texto;
  if (classe) elemento.className = classe;
  return elemento;
}

function formatarData(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toLocaleString("pt-BR") : "Data pendente";
}

function renderizarAgendamentos(documentos) {
  const lista = document.getElementById("listaAgendamentos");
  lista.replaceChildren();

  if (!documentos.length) {
    lista.appendChild(criar("p", "Você ainda não possui agendamentos.", "lista-vazia"));
    return;
  }

  documentos.forEach((item) => {
    const dados = item.data();
    const card = criar("article", "", "item-lista");
    card.append(
      criar("strong", dados.data),
      criar("span", `Plano: ${dados.plano || "Não informado"}`),
      criar("span", `Status: ${dados.status}`),
      criar("small", `Criado em ${formatarData(dados.criadoEm)}`)
    );

    if (dados.status === "pendente" || dados.status === "confirmado") {
      const cancelar = criar("button", "Cancelar agendamento");
      cancelar.type = "button";
      cancelar.addEventListener("click", async () => {
        if (!confirm("Deseja cancelar este agendamento?")) return;
        await updateDoc(doc(db, "agendamentos", item.id), { status: "cancelado", atualizadoEm: serverTimestamp() });
        await carregarPainel(usuarioAtual);
      });
      card.appendChild(cancelar);
    }
    lista.appendChild(card);
  });
}

async function carregarPainel(usuario) {
  usuarioAtual = usuario;
  const [perfilSnap, adminSnap] = await Promise.all([
    getDoc(doc(db, "usuarios", usuario.uid)),
    getDoc(doc(db, "admins", usuario.uid))
  ]);

  if (perfilSnap.exists()) {
    const perfil = perfilSnap.data();
    document.getElementById("saudacao").textContent = `Olá, ${perfil.nome.split(" ")[0]}!`;
    document.getElementById("perfilNome").value = perfil.nome || "";
    document.getElementById("perfilTelefone").value = perfil.telefone || "";
  }
  document.getElementById("perfilEmail").value = usuario.email || "";
  document.getElementById("linkAdmin").hidden = !adminSnap.exists();

  const status = document.getElementById("emailVerificado");
  status.textContent = usuario.emailVerified ? "E-mail verificado" : "E-mail ainda não verificado";
  status.className = `status ${usuario.emailVerified ? "verificado" : "pendente"}`;
  document.getElementById("reenviarVerificacao").hidden = usuario.emailVerified;

  const consulta = query(collection(db, "agendamentos"), where("usuarioId", "==", usuario.uid));
  const agendamentos = await getDocs(consulta);
  const ordenados = [...agendamentos.docs].sort((a, b) => (b.data().criadoEm?.seconds || 0) - (a.data().criadoEm?.seconds || 0));
  renderizarAgendamentos(ordenados);

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
