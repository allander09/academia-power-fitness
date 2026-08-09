import { getIdToken, reload } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";
import { dataLocalISO, possuiAgendamentoAtivo } from "./validacoes.mjs";

const form = document.getElementById("agendamentoForm");
const mensagem = document.getElementById("mensagemAgendamento") || document.getElementById("msg");
const data = form?.querySelector('input[type="date"]');
const hora = form?.querySelector('[name="hora"]');

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
  const hoje = dataLocalISO();
  data.min = hoje;
  carregarHorarios();

  const planoSalvo = sessionStorage.getItem("powerFitnessPlano");
  const campoPlano = form.querySelector('[name="plano"]');
  if (planoSalvo && campoPlano) campoPlano.value = planoSalvo;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await auth.authStateReady();
    const usuario = auth.currentUser;

    if (!usuario) {
      mensagem.innerHTML = 'Entre na sua conta antes de agendar. <a href="login.html">Fazer login</a>';
      mensagem.className = "mensagem erro";
      return;
    }

    await reload(usuario);
    if (!usuario.emailVerified) {
      mensagem.textContent = "Verifique seu e-mail antes de solicitar uma aula.";
      mensagem.className = "mensagem erro";
      return;
    }
    await getIdToken(usuario, true);

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (data.value < hoje) {
      mensagem.textContent = "Escolha uma data a partir de hoje.";
      mensagem.className = "mensagem erro";
      return;
    }

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.textContent = "Salvando...";

    try {
      const existentes = await getDocs(query(collection(db, "agendamentos"), where("usuarioId", "==", usuario.uid)));
      const agendamentos = existentes.docs.map((documento) => documento.data());

      if (possuiAgendamentoAtivo(agendamentos, data.value, hora.value)) {
        mensagem.textContent = "Você já possui uma solicitação ativa nessa data e horário.";
        mensagem.className = "mensagem erro";
        return;
      }

      await addDoc(collection(db, "agendamentos"), {
        usuarioId: usuario.uid,
        nome: form.querySelector('[name="nome"]').value.trim(),
        email: usuario.email,
        data: data.value,
        hora: hora.value,
        plano: campoPlano?.value || "Não informado",
        status: "pendente",
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      });

      mensagem.textContent = "Agendamento salvo! Acompanhe o status na Área do Aluno.";
      mensagem.className = "mensagem sucesso";
      form.reset();
      sessionStorage.removeItem("powerFitnessPlano");
    } catch (error) {
      mensagem.textContent = "Não foi possível salvar. Verifique sua conexão e tente novamente.";
      mensagem.className = "mensagem erro";
      console.error("Falha no agendamento:", error.code);
    } finally {
      botao.disabled = false;
      botao.textContent = "Solicitar aula experimental";
    }
  });
}
