import { createUserWithEmailAndPassword, deleteUser, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { doc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";
import { alternarSenha, mensagemAuth } from "./auth-utils.js";
import { VERSAO_PRIVACIDADE } from "./privacidade-config.mjs";

const form = document.getElementById("cadastroForm");
const feedback = document.getElementById("feedbackCadastro");
const botao = form.querySelector('button[type="submit"]');
const senha = document.getElementById("senha");
const confirmarSenha = document.getElementById("confirmarSenha");

function mostrarFeedback(mensagem, tipo = "sucesso") {
  feedback.textContent = mensagem;
  feedback.className = `feedback ${tipo}`;
  feedback.hidden = false;
}

document.getElementById("alternarSenha").addEventListener("click", (event) => {
  alternarSenha(senha, event.currentTarget);
  confirmarSenha.type = senha.type;
});

document.getElementById("telefone").addEventListener("input", (event) => {
  const numeros = event.target.value.replace(/\D/g, "").slice(0, 11);
  event.target.value = numeros.length > 10
    ? numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
    : numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  feedback.hidden = true;

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const telefone = document.getElementById("telefone").value.trim();

  if (senha.value !== confirmarSenha.value) {
    mostrarFeedback("As senhas não são iguais.", "erro");
    return;
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  botao.disabled = true;
  botao.textContent = "Cadastrando...";
  let credencial;

  try {
    credencial = await createUserWithEmailAndPassword(auth, email, senha.value);

    try {
      await setDoc(doc(db, "usuarios", credencial.user.uid), {
        nome,
        email,
        telefone,
        papel: "aluno",
        privacidadeVersao: VERSAO_PRIVACIDADE,
        privacidadeCienteEm: serverTimestamp(),
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      });
    } catch (firestoreError) {
      await deleteUser(credencial.user);
      throw new Error("Não foi possível salvar o perfil. A criação da conta foi desfeita.", { cause: firestoreError });
    }

    try {
      await sendEmailVerification(credencial.user);
      mostrarFeedback("Cadastro concluído! Enviamos um link de verificação para seu e-mail.");
    } catch {
      mostrarFeedback("Cadastro concluído, mas o e-mail de verificação não pôde ser enviado.", "aviso");
    }

    form.reset();
    setTimeout(() => { window.location.href = "painel.html"; }, 1800);
  } catch (error) {
    mostrarFeedback(error.message?.includes("desfeita") ? error.message : mensagemAuth(error), "erro");
  } finally {
    botao.disabled = false;
    botao.textContent = "Cadastrar";
  }
});
