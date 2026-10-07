import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app-check.js";
import { connectAuthEmulator, getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { connectFirestoreEmulator, getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { emuladoresLocais } from "./ambiente-local.mjs";

const appCheckSiteKey = "6LfWcn0tAAAAAJXiyctX7W5MWoXK_SRVrozJZOfW";
const localDebugAppCheck = !emuladoresLocais
  && typeof window !== "undefined"
  && window.location.protocol === "http:"
  && ["localhost", "127.0.0.1"].includes(window.location.hostname);

const configuracao = emuladoresLocais
  ? { apiKey: "demo-power-fitness", authDomain: "demo-power-fitness.firebaseapp.com", projectId: "demo-power-fitness", appId: "demo-power-fitness" }
  : firebaseConfig;

export const app = getApps().length ? getApp() : initializeApp(configuracao);

// O ambiente local precisa do provedor Debug do App Check. O token é gerado
// pelo SDK e deve ser registrado no Firebase Console; nenhum token é gravado no
// repositório. Em produção, a validação continua usando reCAPTCHA Enterprise.
if (localDebugAppCheck) {
  globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

export const appCheck = emuladoresLocais ? null : initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
  isTokenAutoRefreshEnabled: true,
});

export const auth = getAuth(app);
export const db = getFirestore(app);

if (emuladoresLocais) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  const aviso = document.createElement("p");
  aviso.className = "aviso-demonstracao";
  aviso.setAttribute("role", "status");
  aviso.textContent = "Teste local com dados fictícios. As alterações são temporárias e ficam neste computador.";
  document.querySelector("main")?.prepend(aviso);
} else if (localDebugAppCheck) {
  console.info("Power Fitness: App Check em modo de depuração para localhost. Registre o token exibido pelo Firebase Console > App Check > Gerenciar tokens de depuração.");
}
