import { onAuthStateChanged, reload, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";
import { formatarDataISO } from "./validacoes.mjs";

const conteudo = document.getElementById("conteudoPainel");
const carregando = document.getElementById("carregando");
const feedback = document.getElementById("feedbackPerfil");
let usuarioAtual;
let perfilAtual = {};
let agendamentosAtuais = [];

const rotulosStatus = {
  pendente: "Aguardando confirmação",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  recusado: "Não aprovado",
  lista_espera: "Lista de espera"
};

const rotulosPresenca = {
  presente: "Presente",
  ausente: "Ausente"
};

function criar(tag, texto, classe) {
  const elemento = document.createElement(tag);
  elemento.textContent = texto;
  if (classe) elemento.className = classe;
  return elemento;
}

function formatarTimestamp(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toLocaleString("pt-BR") : "Data pendente";
}

function renderizarAgendamentos(documentos) {
  agendamentosAtuais = documentos.map((item) => ({ id: item.id, ...item.data() }));
  const lista = document.getElementById("listaAgendamentos");
  lista.replaceChildren();

  if (!documentos.length) {
    const vazio = criar("div", "", "lista-vazia");
    vazio.append(criar("p", "Você ainda não possui agendamentos."));
    const novo = criar("a", "Solicitar aula experimental");
    novo.href = "index.html#agendamento";
    novo.className = "link-acao";
    vazio.append(novo);
    lista.appendChild(vazio);
    return;
  }

  documentos.forEach((item) => {
    const dados = item.data();
    const card = criar("article", "", "item-lista");
    const status = criar("span", `Status: ${rotulosStatus[dados.status] || dados.status || "Não informado"}`, `status-agendamento status-${dados.status || "desconhecido"}`);
    card.append(
      criar("strong", dados.hora ? `${formatarDataISO(dados.data)} às ${dados.hora}` : formatarDataISO(dados.data)),
      criar("span", `Atividade: ${dados.atividade || "Aula experimental"}`),
      criar("span", `Professor: ${dados.professorNome || "A definir"}`),
      criar("span", `Plano: ${dados.plano || "Não informado"}`),
      status,
      criar("small", `Presença: ${rotulosPresenca[dados.presenca] || "Não registrada"}`),
      criar("small", `Solicitado em ${formatarTimestamp(dados.criadoEm)}`)
    );

    if (dados.status === "pendente" || dados.status === "confirmado") {
      const cancelar = criar("button", "Cancelar agendamento");
      cancelar.type = "button";
      cancelar.addEventListener("click", async () => {
        if (!confirm("Deseja cancelar este agendamento?")) return;
        cancelar.disabled = true;
        cancelar.textContent = "Cancelando...";
        try {
          await updateDoc(doc(db, "agendamentos", item.id), { status: "cancelado", atualizadoEm: serverTimestamp() });
          await carregarPainel(usuarioAtual);
        } catch (error) {
          cancelar.disabled = false;
          cancelar.textContent = "Cancelar agendamento";
          status.textContent = "Não foi possível cancelar agora. Tente novamente.";
          status.className = "mensagem erro";
          console.error("Falha ao cancelar agendamento:", error.code);
        }
      });
      card.appendChild(cancelar);
    }
    lista.appendChild(card);
  });
}

async function carregarPainel(usuario) {
  usuarioAtual = usuario;
  await reload(usuario);
  const [perfilSnap, adminSnap, professorSnap, privacidadeSnap] = await Promise.all([
    getDoc(doc(db, "usuarios", usuario.uid)),
    getDoc(doc(db, "admins", usuario.uid)),
    getDoc(doc(db, "professores_acesso", usuario.uid)),
    getDoc(doc(db, "solicitacoes_privacidade", usuario.uid))
  ]);

  if (perfilSnap.exists()) {
    const perfil = perfilSnap.data();
    perfilAtual = perfil;
    document.getElementById("saudacao").textContent = `Olá, ${perfil.nome.split(" ")[0]}!`;
    document.getElementById("perfilNome").value = perfil.nome || "";
    document.getElementById("perfilTelefone").value = perfil.telefone || "";
  }
  document.getElementById("perfilEmail").value = usuario.email || "";
  document.getElementById("linkAdmin").hidden = !adminSnap.exists() || adminSnap.data().ativo !== true || !usuario.emailVerified;
  document.getElementById("linkProfessor").hidden = !professorSnap.exists() || professorSnap.data().ativo !== true || !usuario.emailVerified;

  const status = document.getElementById("emailVerificado");
  status.textContent = usuario.emailVerified ? "E-mail verificado" : "E-mail ainda não verificado";
  status.className = `status ${usuario.emailVerified ? "verificado" : "pendente"}`;
  document.getElementById("reenviarVerificacao").hidden = usuario.emailVerified;
  const solicitarExclusao = document.getElementById("solicitarExclusao");
  const solicitacaoPendente = privacidadeSnap.exists() && privacidadeSnap.data().status === "pendente";
  solicitarExclusao.disabled = solicitacaoPendente;
  solicitarExclusao.textContent = solicitacaoPendente ? "Exclusão já solicitada" : "Solicitar exclusão";

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
  const form = event.currentTarget;
  const botao = form.querySelector('button[type="submit"]');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  botao.disabled = true;
  botao.textContent = "Salvando...";
  try {
    await updateDoc(doc(db, "usuarios", usuarioAtual.uid), {
      nome: document.getElementById("perfilNome").value.trim(),
      telefone: document.getElementById("perfilTelefone").value.trim(),
      atualizadoEm: serverTimestamp()
    });
    feedback.textContent = "Perfil atualizado.";
    feedback.className = "mensagem sucesso";
  } catch (error) {
    feedback.textContent = "Não foi possível atualizar o perfil.";
    feedback.className = "mensagem erro";
    console.error("Falha ao atualizar perfil:", error.code);
  } finally {
    botao.disabled = false;
    botao.textContent = "Salvar alterações";
  }
});

document.getElementById("reenviarVerificacao").addEventListener("click", async (event) => {
  const botao = event.currentTarget;
  botao.disabled = true;
  try {
    await reload(usuarioAtual);
    if (usuarioAtual.emailVerified) {
      window.location.reload();
      return;
    }
    await sendEmailVerification(usuarioAtual);
    alert("E-mail de verificação reenviado.");
  } catch {
    alert("Não foi possível reenviar agora. Aguarde alguns minutos e tente novamente.");
  } finally {
    botao.disabled = false;
  }
});

document.getElementById("exportarDados").addEventListener("click", () => {
  const dados = {
    exportadoEm: new Date().toISOString(),
    conta: { uid: usuarioAtual.uid, email: usuarioAtual.email, emailVerificado: usuarioAtual.emailVerified },
    perfil: perfilAtual,
    agendamentos: agendamentosAtuais.map(({ criadoEm, atualizadoEm, ...item }) => ({
      ...item,
      criadoEm: criadoEm?.toDate ? criadoEm.toDate().toISOString() : null,
      atualizadoEm: atualizadoEm?.toDate ? atualizadoEm.toDate().toISOString() : null
    }))
  };
  const arquivo = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = `power-fitness-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  const retorno = document.getElementById("feedbackPrivacidade");
  retorno.textContent = "Arquivo preparado com seus dados de perfil e agendamentos.";
  retorno.className = "mensagem sucesso";
});

document.getElementById("solicitarExclusao").addEventListener("click", async (event) => {
  if (!confirm("Deseja enviar uma solicitação de exclusão dos seus dados? A academia precisará analisar antes de concluir.")) return;
  const botao = event.currentTarget;
  const retorno = document.getElementById("feedbackPrivacidade");
  botao.disabled = true;
  try {
    await setDoc(doc(db, "solicitacoes_privacidade", usuarioAtual.uid), {
      usuarioId: usuarioAtual.uid,
      email: usuarioAtual.email,
      tipo: "exclusao",
      status: "pendente",
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
    botao.textContent = "Exclusão já solicitada";
    retorno.textContent = "Solicitação enviada. A academia deverá confirmar a conclusão pelo canal cadastrado.";
    retorno.className = "mensagem sucesso";
  } catch (error) {
    botao.disabled = false;
    retorno.textContent = "Não foi possível enviar a solicitação agora.";
    retorno.className = "mensagem erro";
    console.error("Falha ao solicitar exclusão:", error.code);
  }
});

document.getElementById("sair").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
