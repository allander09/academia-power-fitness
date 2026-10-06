import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { criarServico } from "./service.mjs";
import { ambienteDemo } from "./ambiente.mjs";

initializeApp();
setGlobalOptions({ region: "southamerica-east1", maxInstances: 3, timeoutSeconds: 300, memory: "256MiB" });
const servico = criarServico({ db: getFirestore(), auth: getAuth(), FieldValue, Timestamp, Erro: HttpsError });
// App Check é obrigatório em produção. O projeto fictício local não possui reCAPTCHA.
const callable = nome => onCall({ enforceAppCheck: !ambienteDemo() }, request => servico[nome](request));
export const solicitarAgendamento = callable("solicitarAgendamento");
export const alterarAgendamento = callable("alterarAgendamento");
export const listarAulasProfessor = callable("listarAulasProfessor");
export const salvarHorario = callable("salvarHorario");
export const exportarDados = callable("exportarDados");
export const excluirConta = callable("excluirConta");
