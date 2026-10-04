import { connectFunctionsEmulator, getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-functions.js";
import { app } from "./firebase-services.js";
import { emuladoresLocais } from "./ambiente-local.mjs";

const functions = getFunctions(app, "southamerica-east1");
if (emuladoresLocais) connectFunctionsEmulator(functions, "127.0.0.1", 5001);
export async function chamarBackend(nome, dados = {}) {
  const resultado = await httpsCallable(functions, nome, { timeout: 300000 })(dados);
  return resultado.data;
}

export function mensagemBackend(error, padrao = "Não foi possível concluir. Tente novamente.") {
  if (error?.code === "functions/internal" || error?.code === "functions/unavailable") return padrao;
  return error?.message || padrao;
}
