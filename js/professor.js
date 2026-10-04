import { getIdToken, onAuthStateChanged, reload, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { chamarBackend, mensagemBackend } from "./backend.js";
import { auth, db } from "./firebase-services.js";
import { DIAS_SEMANA, diasDoHorario } from "./operacao.mjs";
import { formatarDataISO } from "./validacoes.mjs";

const conteudo = document.getElementById("professorConteudo");
const carregando = document.getElementById("carregando");
const feedback = document.getElementById("feedbackProfessor");
let usuarioAtual;

const rotulosStatus = {
  pendente: "Aguardando confirmação",
  confirmado: "Confirmado",
  lista_espera: "Lista de espera",
  cancelado: "Cancelado",
  recusado: "Não aprovado"
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

function celula(texto) {
  return criar("td", texto ?? "—");
}

function diasDaAtividade(dados) {
  return diasDoHorario(dados)
    .map((indice) => DIAS_SEMANA.find((dia) => dia.indice === indice)?.rotulo.slice(0, 3))
    .filter(Boolean)
    .join(", ");
}

function renderizarAtividades(documentos) {
  const lista = document.getElementById("atividadesProfessor");
  lista.replaceChildren();
  if (!documentos.length) {
    lista.append(criar("p", "Nenhuma atividade foi atribuída a esta conta."));
    return;
  }

  documentos
    .sort((a, b) => a.data().hora.localeCompare(b.data().hora))
    .forEach((documento) => {
      const dados = documento.data();
      const item = criar("article", "", "item-resumo");
      item.append(
        criar("strong", `${dados.hora} — ${dados.atividade}`),
        criar("span", `${diasDaAtividade(dados)} · ${dados.capacidade || 20} vagas`),
        criar("small", dados.ativo === false ? "Atividade inativa" : "Atividade ativa")
      );
      lista.append(item);
    });
}

function botaoPresenca(texto, presenca, documento) {
  const botao = criar("button", texto, "botao-tabela");
  botao.type = "button";
  botao.addEventListener("click", async () => {
    botao.disabled = true;
    try {
      await chamarBackend("alterarAgendamento", { aulaId: documento.data().aulaId, presenca });
      feedback.textContent = `Presença registrada como ${rotulosPresenca[presenca].toLowerCase()}.`;
      feedback.className = "mensagem sucesso";
      await carregarProfessor(usuarioAtual);
    } catch (error) {
      feedback.textContent = mensagemBackend(error, "Não foi possível registrar a presença.");
      feedback.className = "mensagem erro";
      console.error("Falha ao registrar presença:", error.code);
    } finally {
      botao.disabled = false;
    }
  });
  return botao;
}

function renderizarAgendamentos(documentos) {
  const tbody = document.getElementById("agendamentosProfessor");
  tbody.replaceChildren();
  if (!documentos.length) {
    const tr = document.createElement("tr");
    const td = celula("Nenhum aluno agendado para suas atividades.");
    td.colSpan = 7;
    tr.append(td);
    tbody.append(tr);
    return;
  }

  documentos
    .sort((a, b) => `${b.data().data} ${b.data().hora}`.localeCompare(`${a.data().data} ${a.data().hora}`))
    .forEach((documento) => {
      const dados = documento.data();
      const tr = document.createElement("tr");
      tr.append(
        celula(formatarDataISO(dados.data)),
        celula(dados.hora),
        celula(dados.nome),
        celula(dados.atividade),
        celula(rotulosStatus[dados.status] || dados.status),
        celula(rotulosPresenca[dados.presenca] || "Não registrada")
      );
      const acoes = document.createElement("td");
      if (dados.status === "confirmado") {
        acoes.append(
          botaoPresenca("Presente", "presente", documento),
          botaoPresenca("Ausente", "ausente", documento)
        );
      } else {
        acoes.textContent = "Sem ações";
      }
      tr.append(acoes);
      tbody.append(tr);
    });
}

async function carregarProfessor(usuario) {
  usuarioAtual = usuario;
  const [acesso, admin] = await Promise.all([
    getDoc(doc(db, "professores_acesso", usuario.uid)),
    getDoc(doc(db, "admins", usuario.uid))
  ]);
  if (!acesso.exists() || acesso.data().ativo !== true) throw new Error("ACESSO_NEGADO");

  const dadosAcesso = acesso.data();
  document.getElementById("professorSaudacao").textContent = `Olá, ${dadosAcesso.nome.split(" ")[0]}!`;
  document.getElementById("professorEspecialidade").textContent = dadosAcesso.especialidade || "Professor";
  document.getElementById("linkAdminProfessor").hidden = !admin.exists() || admin.data().ativo !== true;

  const [atividades, agendamentos] = await Promise.all([
    getDocs(query(collection(db, "horarios"), where("professorUid", "==", usuario.uid))),
    chamarBackend("listarAulasProfessor")
  ]);
  const documentosAulas = agendamentos.aulas.map(dados => ({ data: () => dados }));
  const agendamentosAtivos = documentosAulas.filter((item) => !["cancelado", "recusado"].includes(item.data().status));
  renderizarAtividades(atividades.docs);
  renderizarAgendamentos(documentosAulas);
  document.getElementById("totalAtividadesProfessor").textContent = atividades.docs.filter((item) => item.data().ativo !== false).length;
  document.getElementById("totalAulasProfessor").textContent = agendamentosAtivos.length;
  document.getElementById("totalAlunosProfessor").textContent = agendamentos.totalAlunos;
  carregando.hidden = true;
  conteudo.hidden = false;
}

onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    window.location.href = "login.html";
    return;
  }
  try {
    await reload(usuario);
    if (!usuario.emailVerified) {
      carregando.textContent = "Verifique o e-mail desta conta antes de acessar a área do professor.";
      return;
    }
    await getIdToken(usuario, true);
    await carregarProfessor(usuario);
  } catch (error) {
    carregando.textContent = error.message === "ACESSO_NEGADO"
      ? "Acesso negado: esta conta não possui um perfil de professor ativo."
      : "Não foi possível carregar a área do professor.";
    console.error(error);
  }
});

document.getElementById("sair").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
