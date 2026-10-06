import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { db } from "./firebase-services.js";
import { politicaConfigurada } from "./privacidade-config.mjs";

// A orientação acompanha somente os formulários que coletam dados.
const formularios = [...document.querySelectorAll("#cadastroForm, #agendamentoForm, #formContato")];
if (formularios.length) {
  let mensagem = "Demonstração acadêmica: use dados fictícios neste formulário.";
  try {
    if (politicaConfigurada((await getDoc(doc(db, "configuracoes", "privacidade"))).data())) mensagem = "";
  } catch {
    mensagem = "Este formulário está em configuração. Use apenas dados de teste.";
  }
  if (mensagem) {
    for (const formulario of formularios) {
      const aviso = document.createElement("p");
      aviso.className = "ajuda-campo";
      aviso.setAttribute("role", "status");
      aviso.dataset.avisoPrivacidade = "true";
      aviso.textContent = mensagem;
      formulario.querySelector('button[type="submit"]')?.before(aviso);
    }
  }
}
