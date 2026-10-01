import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";
import { alternarSenha, mensagemAuth } from "./auth-utils.js";
import { destinoPorPerfil } from "./perfis.mjs";

const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const senha = document.getElementById("senha");
const feedback = document.getElementById("feedbackLogin");
const botao = form.querySelector('button[type="submit"]');
let redirecionando = false;

async function destinoAposLogin(usuario) {
  const retorno = sessionStorage.getItem("powerFitnessRetornoLogin");
  if (retorno === "index.html#agendamento") return retorno;
  if (!usuario.emailVerified) return "painel.html";

  try {
    const [admin, professor] = await Promise.all([
      getDoc(doc(db, "admins", usuario.uid)),
      getDoc(doc(db, "professores_acesso", usuario.uid))
    ]);
    return destinoPorPerfil({
      administradorAtivo: admin.exists() && admin.data().ativo === true,
      professorAtivo: professor.exists() && professor.data().ativo === true
    });
  } catch {
    return "painel.html";
  }
}

async function concluirLogin(usuario) {
  if (redirecionando) return;
  redirecionando = true;
  const destino = await destinoAposLogin(usuario);
  sessionStorage.removeItem("powerFitnessRetornoLogin");
  window.location.href = destino;
}

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
    const credencial = await signInWithEmailAndPassword(auth, email.value.trim().toLowerCase(), senha.value);
    await concluirLogin(credencial.user);
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

onAuthStateChanged(auth, async (usuario) => {
  if (usuario) await concluirLogin(usuario);
});
