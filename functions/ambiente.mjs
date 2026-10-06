export function ambienteDemo(variaveis = process.env) {
  return variaveis.FUNCTIONS_EMULATOR === "true"
    && variaveis.GCLOUD_PROJECT === "demo-power-fitness"
    && /^127\.0\.0\.1:8080$/.test(variaveis.FIRESTORE_EMULATOR_HOST || "")
    && /^127\.0\.0\.1:9099$/.test(variaveis.FIREBASE_AUTH_EMULATOR_HOST || "");
}
