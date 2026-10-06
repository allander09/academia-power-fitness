import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { db } from "./firebase-services.js";
import { politicaConfigurada, PRAZOS_PRIVACIDADE } from "./privacidade-config.mjs";

try {
  const snapshot = await getDoc(doc(db, "configuracoes", "privacidade"));
  const dados = snapshot.data() || {};
  if (politicaConfigurada(dados)) {
    document.getElementById("avisoDemonstracao").hidden = true;
    document.getElementById("controladorNome").textContent = dados.controladorNome;
    document.getElementById("controladorDocumento").textContent = dados.controladorDocumento;
    document.getElementById("controladorEndereco").textContent = dados.controladorEndereco;
    const contato = document.getElementById("canalPrivacidade");
    contato.textContent = dados.emailPrivacidade;
    contato.href = `mailto:${dados.emailPrivacidade}`;
  }
  for (const [campo, padrao] of Object.entries(PRAZOS_PRIVACIDADE)) document.getElementById(campo).textContent = String(dados[campo] || padrao);
} catch {
  document.getElementById("avisoDemonstracao").textContent = "A identificação do responsável não pôde ser carregada. Aguarde antes de fornecer dados reais.";
}
