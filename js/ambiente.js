import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { db } from "./firebase-services.js";
import { politicaConfigurada } from "./privacidade-config.mjs";

const aviso = document.createElement("p");
aviso.className = "aviso-demonstracao";
aviso.setAttribute("role", "status");
aviso.textContent = "Demonstração acadêmica: use dados fictícios. A academia responsável ainda precisa ser configurada para o uso comercial.";
const destino = document.querySelector(".hero-content") || document.querySelector("main");
destino?.prepend(aviso);
try {
  if (politicaConfigurada((await getDoc(doc(db, "configuracoes", "privacidade"))).data())) aviso.remove();
} catch { aviso.textContent = "Configuração indisponível. Aguarde antes de fornecer dados pessoais reais."; }
