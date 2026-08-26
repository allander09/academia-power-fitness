import { getIdToken, reload } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";
import { dataLocalISO, idAgendamento, possuiAgendamentoAtivo, validarHorarioAgendamento } from "./validacoes.mjs";

const form = document.getElementById("agendamentoForm");
const mensagem = document.getElementById("mensagemAgendamento") || document.getElementById("msg");
const data = form?.querySelector('input[type="date"]');
const hora = form?.querySelector('[name="hora"]');
const campoNome = form?.querySelector('[name="nome"]');
const campoEmail = form?.querySelector('[name="email"]');
const campoPlano = form?.querySelector('[name="plano"]');

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
    if (perfil.exists() && !campoNome.value) campoNome.value = perfil.data().nome || "";
  } catch (error) {
    console.warn("Não foi possível preencher o perfil.", error.code);
  }
}

async function carregarHorarios() {
  try {
    const snapshot = await getDocs(query(collection(db, "horarios"), where("ativo", "==", true)));
    if (snapshot.empty) return;

    const horarios = snapshot.docs
      .map((documento) => documento.data())
      .sort((a, b) => a.hora.localeCompare(b.hora));

    hora.replaceChildren(new Option("Selecione um horário", ""));
    horarios.forEach((item) => hora.appendChild(new Option(`${item.hora} — ${item.atividade}`, item.hora)));
  } catch (error) {
    console.warn("Não foi possível atualizar os horários; usando opções padrão.", error.code);
  }
}

if (form && data && hora) {
  data.min = dataLocalISO();
  carregarHorarios();
  preencherDadosDaConta();

  const planoSalvo = sessionStorage.getItem("powerFitnessPlano");
  if (planoSalvo && campoPlano) campoPlano.value = planoSalvo;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
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

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const validacao = validarHorarioAgendamento(data.value, hora.value);
    if (!validacao.valido) {
      mostrarMensagem(validacao.mensagem);
      return;
    }

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.textContent = "Salvando...";

    try {
      const existentes = await getDocs(query(collection(db, "agendamentos"), where("usuarioId", "==", usuario.uid)));
      const agendamentos = existentes.docs.map((documento) => documento.data());

      if (possuiAgendamentoAtivo(agendamentos, data.value, hora.value)) {
        mostrarMensagem("Você já possui uma solicitação ativa nessa data e horário.");
        return;
      }

      const identificador = idAgendamento(usuario.uid, data.value, hora.value);
      const referencia = doc(db, "agendamentos", identificador);
      const existenteDeterministico = existentes.docs.find((documento) => documento.id === identificador);
      const valores = {
        nome: campoNome.value.trim(),
        email: usuario.email,
        plano: campoPlano?.value || "Não informado",
        status: "pendente",
        atualizadoEm: serverTimestamp()
      };

      if (existenteDeterministico) {
        await updateDoc(referencia, valores);
      } else {
        await setDoc(referencia, {
          usuarioId: usuario.uid,
          data: data.value,
          hora: hora.value,
          criadoEm: serverTimestamp(),
          ...valores
        });
      }

      mostrarMensagem("Agendamento salvo! Acompanhe o status na Área do Aluno.", "sucesso");
      form.reset();
      data.min = dataLocalISO();
      sessionStorage.removeItem("powerFitnessPlano");
      await preencherDadosDaConta();
    } catch (error) {
      mostrarMensagem("Não foi possível salvar. Verifique sua conexão e tente novamente.");
      console.error("Falha no agendamento:", error.code);
    } finally {
      botao.disabled = false;
      botao.textContent = "Solicitar aula experimental";
    }
  });
}

