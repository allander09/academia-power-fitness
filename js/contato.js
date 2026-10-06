import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase-services.js";
import { VERSAO_PRIVACIDADE } from "./privacidade-config.mjs";

const form = document.getElementById("formContato");
const retorno = document.getElementById("retorno") || document.getElementById("mensagemContato");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.textContent = "Enviando...";

    try {
      await auth.authStateReady();
      await addDoc(collection(db, "contatos"), {
        usuarioId: auth.currentUser?.email?.toLowerCase() === form.querySelector('[name="email"]').value.trim().toLowerCase() ? auth.currentUser.uid : null,
        nome: form.querySelector('[name="nome"]').value.trim(),
        email: form.querySelector('[name="email"]').value.trim().toLowerCase(),
        telefone: form.querySelector('[name="telefone"]')?.value.trim() || "",
        tipoSolicitacao: form.querySelector('[name="tipoSolicitacao"]').value.trim(),
        assunto: form.querySelector('[name="assunto"]').value.trim(),
        mensagem: form.querySelector('[name="mensagem"]').value.trim(),
        status: "novo",
        privacidadeVersao: VERSAO_PRIVACIDADE,
        privacidadeCienteEm: serverTimestamp(),
        criadoEm: serverTimestamp()
      });

      retorno.textContent = "Solicitação enviada. Nossa equipe entrará em contato.";
      retorno.className = "mensagem sucesso";
      form.reset();
    } catch (error) {
      retorno.textContent = "Não foi possível enviar a mensagem agora.";
      retorno.className = "mensagem erro";
      console.error("Falha no contato:", error.code);
    } finally {
      botao.disabled = false;
      botao.textContent = "Enviar solicitação";
    }
  });
}
