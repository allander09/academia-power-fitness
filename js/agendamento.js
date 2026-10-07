import { getIdToken, reload } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { chamarBackend, mensagemBackend } from "./backend.js";
import { auth, db } from "./firebase-services.js";
import { mensagemAuth } from "./auth-utils.js";
import { cpfValido, dataLocalISO, formatarDataISO, normalizarCpf } from "./validacoes.mjs";

const form = document.getElementById("agendamentoForm");
const mensagem = document.getElementById("mensagemAgendamento");
const data = document.getElementById("dataAgendamento");
const plano = document.getElementById("planoAgendamento");
const etapas = [...document.querySelectorAll(".agenda-etapa")];
const botaoVoltar = document.getElementById("voltarEtapa");
const botaoAvancar = document.getElementById("avancarEtapa");
const botaoConfirmar = document.getElementById("confirmarAgendamento");
const confirmacao = document.getElementById("confirmacaoAgendamento");
const detalhesConfirmacao = document.getElementById("detalhesConfirmacao");
const tipoAgendamento = document.getElementById("tipoAgendamento");
const cpfExperimental = document.getElementById("cpfExperimental");
const cpfExperimentalGrupo = document.getElementById("cpfExperimentalGrupo");

let etapaAtual = 1;
let disponibilidade = [];
let disponibilidadeData = [];
const escolha = { atividade: "", professorUid: "", professorNome: "", horarioId: "", hora: "", data: "", plano: "Ainda não decidi", tipoAgendamento: "normal", cpf: "" };

const rotulosIndisponivel = {
  fora_funcionamento: "Fora do funcionamento",
  data_passada: "Data ou horário passado",
  sem_vagas: "Sem vagas"
};

function mostrarMensagem(texto, tipo = "erro") {
  if (!mensagem) return;
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function limparMensagem() {
  if (!mensagem) return;
  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

function resumo(id, texto) {
  const alvo = document.getElementById(id);
  if (alvo) alvo.textContent = texto;
}

function atualizarResumo() {
  resumo("resumoAtividade", escolha.atividade || "Escolha uma atividade");
  resumo("resumoProfessor", escolha.professorNome || "Defina o professor");
  resumo("resumoData", escolha.data ? formatarDataISO(escolha.data) : "Escolha a data");
  resumo("resumoHorario", escolha.hora || "Escolha o horário");
  resumo("resumoPlano", escolha.plano || "Ainda não definido");
  const revisaoTipo = escolha.tipoAgendamento === "experimental" ? "Aula experimental" : "Aula normal";
  const revisao = document.getElementById("textoRevisao");
  if (revisao) {
    revisao.textContent = escolha.horarioId
      ? `${escolha.atividade} com ${escolha.professorNome || "professor a definir"}, em ${formatarDataISO(escolha.data)} às ${escolha.hora}.`
      : "Confira as informações antes de confirmar.";
    revisao.textContent += escolha.horarioId ? " Tipo: " + revisaoTipo + "." : "";
  }
}

function atualizarTipoAgendamento() {
  escolha.tipoAgendamento = tipoAgendamento?.value === "experimental" ? "experimental" : "normal";
  if (cpfExperimentalGrupo) cpfExperimentalGrupo.hidden = escolha.tipoAgendamento !== "experimental";
  if (cpfExperimental) cpfExperimental.required = escolha.tipoAgendamento === "experimental";
  atualizarResumo();
}

function irParaEtapa(numero) {
  etapaAtual = Math.max(1, Math.min(4, numero));
  etapas.forEach(etapa => {
    const ativa = Number(etapa.dataset.etapa) === etapaAtual;
    etapa.hidden = !ativa;
    etapa.classList.toggle("ativa", ativa);
  });
  document.getElementById("progressoAgendamento").textContent = `Etapa ${etapaAtual} de 4`;
  botaoVoltar.disabled = etapaAtual === 1;
  botaoAvancar.hidden = etapaAtual === 4;
  botaoConfirmar.hidden = etapaAtual !== 4;
  limparMensagem();
  atualizarResumo();
}

function criarOpcao({ titulo, detalhe, selecionada, desabilitada = false, onClick }) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = `opcao-agendamento${selecionada ? " selecionada" : ""}`;
  botao.disabled = desabilitada;
  botao.append(Object.assign(document.createElement("strong"), { textContent: titulo }));
  if (detalhe) botao.append(Object.assign(document.createElement("span"), { textContent: detalhe }));
  botao.addEventListener("click", onClick);
  return botao;
}

function atividadesUnicas() {
  return [...new Set(disponibilidade.map(item => item.atividade).filter(Boolean))].sort();
}

function professoresDaAtividade() {
  const mapa = new Map();
  disponibilidade
    .filter(item => item.atividade === escolha.atividade && item.professorUid)
    .forEach(item => mapa.set(item.professorUid, { uid: item.professorUid, nome: item.professorNome, especialidade: item.professorEspecialidade }));
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
}

function horariosDaEscolha() {
  return disponibilidadeData.filter(item => item.atividade === escolha.atividade && item.professorUid === escolha.professorUid);
}

function renderizarAtividades() {
  const alvo = document.getElementById("opcoesAtividade");
  alvo.replaceChildren();
  const atividades = atividadesUnicas();
  if (!atividades.length) {
    alvo.textContent = "Nenhuma atividade disponível no momento.";
    return;
  }
  atividades.forEach(atividade => alvo.append(criarOpcao({
    titulo: atividade,
    detalhe: `${disponibilidade.filter(item => item.atividade === atividade).length} horário(s) cadastrado(s)`,
    selecionada: escolha.atividade === atividade,
    onClick: () => {
      escolha.atividade = atividade;
      escolha.professorUid = ""; escolha.professorNome = ""; escolha.horarioId = ""; escolha.hora = "";
      renderizarAtividades(); renderizarProfessores(); atualizarResumo();
    }
  })));
}

function renderizarProfessores() {
  const alvo = document.getElementById("opcoesProfessor");
  alvo.replaceChildren();
  if (!escolha.atividade) {
    alvo.textContent = "Escolha uma atividade primeiro.";
    return;
  }
  const professores = professoresDaAtividade();
  if (!professores.length) {
    alvo.textContent = "Esta atividade ainda não possui professor ativo vinculado.";
    return;
  }
  professores.forEach(professor => alvo.append(criarOpcao({
    titulo: professor.nome,
    detalhe: professor.especialidade || "Professor ativo",
    selecionada: escolha.professorUid === professor.uid,
    onClick: () => {
      escolha.professorUid = professor.uid; escolha.professorNome = professor.nome; escolha.horarioId = ""; escolha.hora = "";
      renderizarProfessores(); renderizarHorarios(); atualizarResumo();
    }
  })));
}

function renderizarHorarios() {
  const alvo = document.getElementById("opcoesHorario");
  alvo.replaceChildren();
  if (!escolha.data) {
    alvo.textContent = "Escolha uma data para carregar os horários.";
    return;
  }
  const horarios = horariosDaEscolha().sort((a, b) => a.hora.localeCompare(b.hora));
  if (!horarios.length) {
    alvo.textContent = "Não há horários para este professor nesta data.";
    return;
  }
  horarios.forEach(horario => alvo.append(criarOpcao({
    titulo: horario.hora,
    detalhe: horario.disponivel ? `${horario.vagasDisponiveis} vaga(s) disponível(is)` : rotulosIndisponivel[horario.motivoIndisponivel] || "Indisponível",
    selecionada: escolha.horarioId === horario.id,
    desabilitada: !horario.disponivel,
    onClick: () => {
      escolha.horarioId = horario.id; escolha.hora = horario.hora;
      renderizarHorarios(); atualizarResumo();
    }
  })));
}

async function carregarPlanos() {
  if (!plano) return;
  try {
    const snapshot = await getDocs(query(collection(db, "planos"), where("ativo", "==", true)));
    plano.replaceChildren(new Option("Ainda não decidi", "Ainda não decidi"));
    snapshot.docs
      .map(item => item.data())
      .sort((a, b) => (a.ordem || 99) - (b.ordem || 99) || a.nome.localeCompare(b.nome))
      .forEach(item => plano.append(new Option(item.nome, item.nome)));
    const salvo = sessionStorage.getItem("powerFitnessPlano");
    if ([...plano.options].some(opcao => opcao.value === salvo)) plano.value = salvo;
    escolha.plano = plano.value;
  } catch {
    plano.replaceChildren(new Option("Ainda não decidi", "Ainda não decidi"));
  }
}

async function carregarDisponibilidade(dataEscolhida = "") {
  const retorno = await chamarBackend("listarDisponibilidadeAgendamento", dataEscolhida ? { data: dataEscolhida } : {});
  return retorno.horarios || [];
}

async function carregarInicial() {
  if (!form) return;
  data.min = dataLocalISO();
  await auth.authStateReady();
  const usuario = auth.currentUser;
  if (usuario) {
    const email = document.getElementById("emailAgendamento");
    const nome = document.getElementById("nomeAgendamento");
    if (email) email.value = usuario.email || "";
    try {
      const perfil = await getDoc(doc(db, "usuarios", usuario.uid));
      if (perfil.exists() && nome) nome.value = perfil.data().nome || "";
    } catch {
      // O perfil é complementar ao agendamento; a Function valida antes de gravar.
    }
  }
  try {
    [disponibilidade] = await Promise.all([carregarDisponibilidade(), carregarPlanos()]);
    renderizarAtividades();
  } catch (error) {
    mostrarMensagem(mensagemBackend(error, "Não foi possível carregar as atividades. Atualize a página e tente novamente."));
  }
  irParaEtapa(1);
}

function validarEtapa() {
  if (etapaAtual === 1 && escolha.tipoAgendamento === "experimental" && !cpfValido(cpfExperimental?.value || "")) return "Informe um CPF válido para a aula experimental.";
  if (etapaAtual === 1 && !escolha.atividade) return "Escolha uma atividade para continuar.";
  if (etapaAtual === 2 && !escolha.professorUid) return "Escolha um professor para continuar.";
  if (etapaAtual === 3) {
    if (!escolha.data) return "Escolha uma data para continuar.";
    if (!escolha.horarioId) return "Escolha um horário disponível.";
  }
  return "";
}

tipoAgendamento?.addEventListener("change", atualizarTipoAgendamento);

cpfExperimental?.addEventListener("input", () => {
  escolha.cpf = normalizarCpf(cpfExperimental.value);
});

botaoAvancar?.addEventListener("click", async () => {
  const erro = validarEtapa();
  if (erro) { mostrarMensagem(erro); return; }
  irParaEtapa(etapaAtual + 1);
});

botaoVoltar?.addEventListener("click", () => irParaEtapa(etapaAtual - 1));

data?.addEventListener("change", async () => {
  escolha.data = data.value;
  escolha.horarioId = ""; escolha.hora = "";
  renderizarHorarios(); atualizarResumo();
  if (!data.value) return;
  document.getElementById("horarioAgendamentoAjuda").textContent = "Carregando horários disponíveis...";
  try {
    disponibilidadeData = await carregarDisponibilidade(data.value);
    document.getElementById("horarioAgendamentoAjuda").textContent = "Escolha um horário com vaga disponível.";
    renderizarHorarios();
  } catch (error) {
    document.getElementById("horarioAgendamentoAjuda").textContent = "Não foi possível carregar os horários desta data.";
    mostrarMensagem(mensagemBackend(error, "Não foi possível carregar os horários."));
  }
});

plano?.addEventListener("change", () => {
  escolha.plano = plano.value;
  atualizarResumo();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const erro = validarEtapa();
  if (erro) { mostrarMensagem(erro); return; }
  botaoConfirmar.disabled = true;
  botaoConfirmar.textContent = "Confirmando...";

  try {
    await auth.authStateReady();
    const usuario = auth.currentUser;
    if (!usuario) {
      sessionStorage.setItem("powerFitnessRetornoLogin", "agenda.html");
      mostrarMensagem("Entre na sua conta antes de agendar. Use o botão Entrar no topo da página.");
      return;
    }
    await reload(usuario);
    if (!usuario.emailVerified) {
      mostrarMensagem("Verifique seu e-mail antes de agendar uma aula.");
      return;
    }
    await getIdToken(usuario, true);
    const cpf = (cpfExperimental?.value || "").replace(/\D/g, "");
    if (escolha.tipoAgendamento === "experimental" && !cpfValido(cpf)) {
      mostrarMensagem("Informe um CPF válido para agendar a aula experimental.");
      return;
    }
    const retorno = await chamarBackend("solicitarAgendamento", {
      data: escolha.data,
      horarioId: escolha.horarioId,
      professorUid: escolha.professorUid,
      plano: plano?.value || "Ainda não decidi",
      tipoAgendamento: escolha.tipoAgendamento,
      cpf: escolha.tipoAgendamento === "experimental" ? cpf : undefined
    });
    detalhesConfirmacao.className = "detalhes-confirmacao";
    detalhesConfirmacao.innerHTML = `<div><span>Atividade</span><strong>${escolha.atividade}</strong></div>
      <div><span>Professor</span><strong>${escolha.professorNome}</strong></div>
      <div><span>Data</span><strong>${formatarDataISO(escolha.data)}</strong></div>
      <div><span>Horário</span><strong>${escolha.hora}</strong></div>
      <div><span>Tipo</span><strong>${escolha.tipoAgendamento === "experimental" ? "Aula experimental" : "Aula normal"}</strong></div>`;
    confirmacao.hidden = false;
    etapas.forEach(etapa => { etapa.hidden = true; etapa.classList.remove("ativa"); });
    document.querySelector(".agenda-acoes").hidden = true;
    mostrarMensagem(retorno.status === "pendente" ? "Seu agendamento foi enviado para confirmação." : "Agendamento salvo.", "sucesso");
    sessionStorage.removeItem("powerFitnessPlano");
  } catch (error) {
    mostrarMensagem(error.code?.startsWith("auth/") ? mensagemAuth(error) : mensagemBackend(error, "Não foi possível confirmar este agendamento."));
  } finally {
    botaoConfirmar.disabled = false;
    botaoConfirmar.textContent = "Confirmar agendamento";
  }
});

atualizarTipoAgendamento();
carregarInicial();