import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getFirestore, doc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const form = document.getElementById("cadastroForm");
const feedback = document.getElementById("feedbackCadastro");
const botao = form?.querySelector('button[type="submit"]');

function mostrarFeedback(mensagem, tipo = "sucesso") {
  if (!feedback) return;
  feedback.textContent = mensagem;
  feedback.className = `feedback ${tipo}`;
  feedback.hidden = false;
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const senha = document.getElementById("senha").value;

    if (!nome || !email || !telefone || senha.length < 6) {
      mostrarFeedback("Preencha todos os campos. A senha deve ter pelo menos 6 caracteres.", "erro");
      return;
    }

    botao.disabled = true;
    botao.textContent = "Cadastrando...";

    try {
      const credencial = await createUserWithEmailAndPassword(auth, email, senha);
      await setDoc(doc(db, "usuarios", credencial.user.uid), {
        nome,
        email,
        telefone,
        criadoEm: serverTimestamp()
      });

      form.reset();
      mostrarFeedback("Cadastro realizado com sucesso!");
    } catch (error) {
      const mensagens = {
        "auth/email-already-in-use": "Este e-mail já está cadastrado.",
        "auth/invalid-email": "Informe um e-mail válido.",
        "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
        "auth/network-request-failed": "Sem conexão com a internet."
      };
      mostrarFeedback(mensagens[error.code] || "Não foi possível concluir o cadastro.", "erro");
      console.error("Falha no cadastro:", error.code);
    } finally {
      botao.disabled = false;
      botao.textContent = "Cadastrar";
    }
  });
}
