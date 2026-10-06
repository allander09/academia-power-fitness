import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { FUNCIONAMENTO_PADRAO } from "../js/operacao.mjs";

const require = createRequire(new URL("../functions/package.json", import.meta.url));
const { initializeApp, deleteApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

export const SENHA_DEMO = "TesteLocal2026!";
export const CONTAS_DEMO = [
  { uid: "demo-admin", email: "admin@example.com", nome: "Administrador de teste", verificado: true },
  { uid: "demo-professor", email: "professor@example.com", nome: "Professor de teste", verificado: true },
  { uid: "demo-aluno", email: "aluno@example.com", nome: "Aluno de teste", verificado: true },
  { uid: "demo-aluno2", email: "aluno2@example.com", nome: "Segundo aluno de teste", verificado: true },
  { uid: "demo-novo", email: "novo@example.com", nome: "Conta sem verificação", verificado: false }
];

export async function criarDadosDemo() {
  if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080" || process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9099") {
    throw new Error("A carga fictícia exige os emuladores locais. Nenhum dado foi gravado.");
  }
  const app = initializeApp({ projectId: "demo-power-fitness" }, `carga-demo-${randomUUID()}`);
  const auth = getAuth(app), db = getFirestore(app);
  const gravarNovo = async (caminho, dados) => {
    const ref = db.doc(caminho);
    if (!(await ref.get()).exists) await ref.create(dados);
  };
  try {
    const agora = Timestamp.now();
    for (const conta of CONTAS_DEMO) {
      try { await auth.createUser({ uid: conta.uid, email: conta.email, displayName: conta.nome, password: SENHA_DEMO, emailVerified: conta.verificado }); }
      catch (error) { if (error.code !== "auth/uid-already-exists") throw error; }
      await gravarNovo(`usuarios/${conta.uid}`, { nome: conta.nome, email: conta.email, telefone: "85999990000", papel: "aluno", criadoEm: agora, atualizadoEm: agora, privacidadeVersao: "2026-10-04", privacidadeCienteEm: agora });
    }
    await gravarNovo("admins/demo-admin", { ativo: true });
    await gravarNovo("professores_acesso/demo-professor", { ativo: true, nome: "Professor de teste", especialidade: "Treinamento funcional", atualizadoEm: agora });
    await gravarNovo("configuracoes/funcionamento", { ...FUNCIONAMENTO_PADRAO, atualizadoEm: agora, atualizadoPor: "demo-admin" });
    await gravarNovo("configuracoes/privacidade", { publicada: false, versao: "2026-10-04", controladorNome: "", controladorDocumento: "", controladorEndereco: "", emailPrivacidade: "", agendamentosDias: 180, contatosDias: 90, auditoriaDias: 365 });
    await gravarNovo("planos/essencial", { nome: "Essencial", valor: 129.9, beneficios: ["Musculação", "Aulas em grupo"], ativo: true, ordem: 1 });
    await gravarNovo("planos/completo", { nome: "Completo", valor: 179.9, beneficios: ["Musculação", "Aulas em grupo", "Avaliação física"], ativo: true, ordem: 2 });
    await gravarNovo("professores/funcional", { nome: "Professor de teste", especialidade: "Treinamento funcional", fotoUrl: "", ativo: true });
    await gravarNovo("horarios/funcional", { hora: "10:00", atividade: "Funcional", capacidade: 1, diasSemana: [1, 2, 3, 4, 5, 6], ativo: true, professorUid: "demo-professor", professorNome: "Professor de teste", criadoEm: agora, atualizadoEm: agora });
    await gravarNovo("horarios/musculacao", { hora: "11:00", atividade: "Musculação", capacidade: 20, diasSemana: [1, 2, 3, 4, 5, 6], ativo: true, professorUid: "demo-professor", professorNome: "Professor de teste", criadoEm: agora, atualizadoEm: agora });
    const futuro = new Date(Date.now() + 86400000);
    let data = futuro.toISOString().slice(0, 10);
    if (new Date(`${data}T12:00:00-03:00`).getUTCDay() === 0) data = new Date(futuro.getTime() + 86400000).toISOString().slice(0, 10);
    for (const [uid, status] of [["demo-aluno", "pendente"], ["demo-aluno2", "confirmado"]]) {
      const conta = CONTAS_DEMO.find(item => item.uid === uid);
      await gravarNovo(`agendamentos/${uid}_${data}_10:00`, { usuarioId: uid, nome: conta.nome, email: conta.email, data, hora: "10:00", horarioId: "funcional", atividade: "Funcional", plano: "Essencial", professorUid: "demo-professor", professorNome: "Professor de teste", status, presenca: "nao_registrada", aulaId: randomUUID(), criadoEm: agora, atualizadoEm: agora });
    }
    return { data };
  } finally { await deleteApp(app); }
}
