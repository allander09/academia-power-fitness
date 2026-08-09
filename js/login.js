import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { auth } from "./firebase-services.js";
import { alternarSenha, mensagemAuth } from "./auth-utils.js";

const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const senha = document.getElementById("senha");
const feedback = document.getElementById("feedbackLogin");
const botao = form.querySelector('button[type="submit"]');

function mostrarFeedback(mensagem, tipo = "sucesso") {
  feedback.textContent = mensagem;
  feedback.className = `feedback ${tipo}`;
  feedback.hidden = false;
}

document.getElementById("alternarSenha").addEventListener("click", (event) => alternarSenha(senha, event.currentTarget));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  botao.disabled = true;
  botao.textContent = "Entrando...";

  try {
    await signInWithEmailAndPassword(auth, email.value.trim().toLowerCase(), senha.value);
    window.location.href = "painel.html";
  } catch (error) {
    mostrarFeedback(mensagemAuth(error), "erro");
  } finally {
    botao.disabled = false;
    botao.textContent = "Entrar";
  }
});

document.getElementById("recuperarSenha").addEventListener("click", async () => {
  if (!email.value.trim()) {
    mostrarFeedback("Digite seu e-mail para receber a recuperação.", "erro");
    email.focus();
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email.value.trim().toLowerCase());
    mostrarFeedback("Se esse e-mail estiver cadastrado, você receberá as instruções.");
  } catch (error) {
    mostrarFeedback(mensagemAuth(error), "erro");
  }
});

onAuthStateChanged(auth, (usuario) => {
  if (usuario) window.location.href = "painel.html";
});
