import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
const require = createRequire(new URL("../functions/package.json", import.meta.url));
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const args = process.argv.slice(2);
const projectId = args[args.indexOf("--project") + 1];
if (!args.includes("--project") || !projectId || projectId.startsWith("--")) {
  console.error("Uso: node scripts/migrar-2-5.mjs --project ID [--apply]. Sem --apply, apenas relata a migração.");
  process.exit(1);
}
initializeApp({ projectId, credential: applicationDefault() });
const db = getFirestore();
const [horarios, agendamentos] = await Promise.all([db.collection("horarios").get(), db.collection("agendamentos").get()]);
const alteracoes = [];
const pendencias = [];
for (const item of agendamentos.docs) {
  const dados = item.data();
  let horario = horarios.docs.find(h => h.id === dados.horarioId);
  if (!horario) {
    const candidatos = horarios.docs.filter(h => h.data().hora === dados.hora && (!dados.atividade || h.data().atividade === dados.atividade));
    if (candidatos.length === 1) horario = candidatos[0];
  }
  if (!horario) { pendencias.push({ id: item.id, motivo: "Atividade ausente ou ambígua. Vincule manualmente antes da publicação." }); continue; }
  const atualizado = {};
  if (!dados.aulaId) atualizado.aulaId = randomUUID();
  if (dados.horarioId !== horario.id) atualizado.horarioId = horario.id;
  if (!dados.presenca) atualizado.presenca = "nao_registrada";
  if (Object.keys(atualizado).length) alteracoes.push({ referencia: item.ref, atualizado });
}
console.log(JSON.stringify({ projectId, total: agendamentos.size, alteracoes: alteracoes.length, pendencias }, null, 2));
if (pendencias.length && args.includes("--apply")) { console.error("Migração interrompida: resolva as pendências primeiro."); process.exit(1); }
if (args.includes("--apply")) {
  const writer = db.bulkWriter();
  const operacoes = alteracoes.map(item => writer.update(item.referencia, item.atualizado));
  await writer.close(); await Promise.all(operacoes);
  console.log("Migração concluída. Reexecute sem --apply para conferir.");
}
