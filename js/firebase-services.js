import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app-check.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const appCheckSiteKey = "6LfWcn0tAAAAAJXiyctX7W5MWoXK_SRVrozJZOfW";
const localHosts = new Set(["localhost", "127.0.0.1"]);

if (localHosts.has(globalThis.location?.hostname)) {
  globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
  isTokenAutoRefreshEnabled: true,
});
export const auth = getAuth(app);
export const db = getFirestore(app);
