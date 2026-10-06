import { getIdToken, reload } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { chamarBackend, mensagemBackend } from "./backend.js";
import { auth, db } from "./firebase-services.js";
import { mensagemAuth } from "./auth-utils.js";
import { capacidadeDoHorario, horarioDisponivelNoDia, indiceDiaDaData, normalizarFuncionamento } from "./operacao.mjs";
import { dataLocalISO, validarHorarioAgendamento } from "./validacoes.mjs";

const form = document.getElementById("agendamentoForm");
const mensagem = document.getElementById("mensagemAgendamento");
const data = form?.querySelector('input[type="date"]');
const hora = form?.querySelector('[name="hora"]');
const campoNome = form?.querySelector('[name="nome"]');
const campoEmail = form?.querySelector('[name="email"]');
const campoPlano = form?.querySelector('[name="plano"]');
const ajudaHorario = document.getElementById("horarioAgendamentoAjuda");
let horariosAtivos = [];
let funcionamento = normalizarFuncionamento();
let operacaoCarregada = false;

function mostrarMensagem(texto, tipo = "erro") {
  mensagem.replaceChildren();
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function pedirLogin() {
  sessionStorage.setItem("powerFitnessRetornoLogin", "index.html#agendamento");
  mensagem.replaceChildren(document.createTextNode("Entre na sua conta antes de agendar. "));
  const link = document.createElement("a");
  link.href = "login.html";
  link.textContent = "Fazer login";
  mensagem.appendChild(link);
  mensagem.className = "mensagem erro";
}

async function preencherDadosDaConta() {
  await auth.authStateReady();
  const usuario = auth.currentUser;
  if (!usuario || !form) return;

  campoEmail.value = usuario.email || "";
  campoEmail.readOnly = true;
  campoEmail.setAttribute("aria-describedby", "emailAgendamentoAjuda");

  try {
    const perfil = await getDoc(doc(db, "usuarios", usuario.uid));
    if (perfil.exists()) { campoNome.value = perfil.data().nome || ""; campoNome.readOnly = true; }
  } catch (error) {
    console.warn("Não foi possível preencher o perfil.", error.code);
  }
}

function atualizarOpcoesHorario() {
  if (!hora) return;
  const dataSelecionada = data?.value;
  hora.replaceChildren(new Option(dataSelecionada ? "Selecione um horário" : "Escolha a data primeiro", ""));
  hora.disabled = !dataSelecionada;
  if (!dataSelecionada) {
    if (ajudaHorario) ajudaHorario.textContent = "Os horários disponíveis dependem do dia escolhido.";
    return;
  }

  const indiceDia = indiceDiaDaData(dataSelecionada);
  const disponiveis = horariosAtivos.filter(({ dados }) => horarioDisponivelNoDia(dados, indiceDia, funcionamento));
  disponiveis.forEach(({ id, dados }) => {
    const capacidade = capacidadeDoHorario(dados, funcionamento);
    const option = new Option(`${dados.hora} — ${dados.atividade} (${capacidade} vagas)`, dados.hora);
    option.dataset.horarioId = id;
    option.dataset.atividade = dados.atividade;
    option.dataset.professorUid = dados.professorUid || "";
    option.dataset.professorNome = dados.professorNome || "";
    hora.appendChild(option);
  });

  if (ajudaHorario) {
    ajudaHorario.textContent = disponiveis.length
      ? "A vaga é confirmada pela academia. Se a turma lotar, sua solicitação poderá entrar na lista de espera."
      : "Não há atividades disponíveis para esse dia.";
  }
}

async function carregarOperacao() {
  try {
    const [horariosSnapshot, funcionamentoSnapshot] = await Promise.all([
      getDocs(query(collection(db, "horarios"), where("ativo", "==", true))),
      getDoc(doc(db, "configuracoes", "funcionamento"))
    ]);
    horariosAtivos = horariosSnapshot.docs
      .map((documento) => ({ id: documento.id, dados: documento.data() }))
      .sort((a, b) => a.dados.hora.localeCompare(b.dados.hora));
    if (funcionamentoSnapshot.exists()) funcionamento = normalizarFuncionamento(funcionamentoSnapshot.data());
    operacaoCarregada = true;
    atualizarOpcoesHorario();
  } catch (error) {
    operacaoCarregada = false;
    horariosAtivos = [];
    console.warn("Não foi possível carregar os horários da academia.", error.code);
    atualizarOpcoesHorario();
    if (ajudaHorario) ajudaHorario.textContent = "Não foi possível carregar os horários. Atualize a página e tente novamente.";
  }
}

if (form && data && hora) {
  data.min = dataLocalISO();
  const opcoesIniciais = [...hora.options]
    .filter((option) => option.value)
    .map((option) => ({ id: `padrao-${option.value}`, dados: { hora: option.value, atividade: option.textContent, diasSemana: [1, 2, 3, 4, 5, 6] } }));
  horariosAtivos = opcoesIniciais;
  data.addEventListener("change", atualizarOpcoesHorario);
  atualizarOpcoesHorario();
  carregarOperacao();
  preencherDadosDaConta();

  const planoSalvo = sessionStorage.getItem("powerFitnessPlano");
  if (planoSalvo && campoPlano) campoPlano.value = planoSalvo;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const botao = form.querySelector('button[type="submit"]');
    if (botao.disabled) return;
    botao.disabled = true;
    botao.textContent = "Aguarde...";

    try {
      await auth.authStateReady();
      const usuario = auth.currentUser;
      if (!usuario) {
        pedirLogin();
        return;
      }
      await reload(usuario);
      if (!usuario.emailVerified) {
        mostrarMensagem("Verifique seu e-mail antes de solicitar uma aula.");
        return;
      }
      await getIdToken(usuario, true);
      if (!operacaoCarregada) {
        mostrarMensagem("Aguarde o carregamento dos horários antes de agendar.");
        return;
      }
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const validacao = validarHorarioAgendamento(data.value, hora.value, new Date(), funcionamento);
      if (!validacao.valido) {
        mostrarMensagem(validacao.mensagem);
        return;
      }
      botao.textContent = "Salvando...";
      const opcaoHorario = hora.selectedOptions[0];
      await chamarBackend("solicitarAgendamento", {
        data: data.value,
        horarioId: opcaoHorario?.dataset.horarioId || "",
        plano: campoPlano.value
      });

      mostrarMensagem("Agendamento salvo! Acompanhe o status na Área do Aluno.", "sucesso");
      form.reset();
      data.min = dataLocalISO();
      atualizarOpcoesHorario();
      sessionStorage.removeItem("powerFitnessPlano");
      await preencherDadosDaConta();
    } catch (error) {
      const padrao = "Não foi possível salvar. Verifique sua conexão e tente novamente.";
      mostrarMensagem(error.code?.startsWith("auth/") ? mensagemAuth(error, padrao) : mensagemBackend(error, padrao));
      console.error("Falha no agendamento:", error.code);
    } finally {
      botao.disabled = false;
      botao.textContent = "Solicitar aula experimental";
    }
  });
}
