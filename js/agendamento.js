import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";

const form = document.getElementById("agendamentoForm");
const mensagem = document.getElementById("mensagemAgendamento") || document.getElementById("msg");
const data = form?.querySelector('input[type="date"]');

if (form && data) {
  const hoje = new Date().toISOString().split("T")[0];
  data.min = hoje;

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
      await addDoc(collection(db, "agendamentos"), {
        usuarioId: usuario.uid,
        nome: form.querySelector('[name="nome"]').value.trim(),
        email: usuario.email,
        data: data.value,
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
