import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function ler(caminho) {
  return readFileSync(resolve(raiz, caminho), "utf8");
}

test("não existem IDs duplicados nas páginas principais", () => {
  for (const pagina of ["html/index.html", "html/admin.html", "html/painel.html", "html/professor.html", "html/login.html", "html/formularios.html"]) {
    const ids = [...ler(pagina).matchAll(/\sid="([^"]+)"/g)].map((resultado) => resultado[1]);
    assert.deepEqual(ids.filter((id, indice) => ids.indexOf(id) !== indice), [], `IDs duplicados em ${pagina}`);
  }
});

test("os controles usados pelos módulos existem no HTML", () => {
  const contratos = {
    "html/admin.html": [
      "adminConteudo", "carregando", "feedbackAdmin", "agendamentosAdmin", "contatosAdmin",
      "alunosAdmin", "buscaAlunos", "funcionamentoForm", "funcionamentoDias", "capacidadePadraoAdmin",
      "privacidadeAdmin", "auditoriaAdmin", "planoForm", "professorForm", "horarioForm",
      "horarioCapacidadeAdmin", "horarioProfessorAdmin", "professorAcessoForm", "professorContaAdmin",
      "listaProfessoresAcessoAdmin", "totalProfessoresAcesso", "totalAlunos", "totalAgendamentos", "totalContatos", "totalPrivacidade"
    ],
    "html/painel.html": [
      "conteudoPainel", "carregando", "perfilForm", "listaAgendamentos", "exportarDados",
      "solicitarExclusao", "feedbackPrivacidade", "linkProfessor", "linkAdmin", "reenviarVerificacao"
    ],
    "html/professor.html": [
      "professorConteudo", "carregando", "professorSaudacao", "professorEspecialidade",
      "atividadesProfessor", "agendamentosProfessor", "totalAtividadesProfessor", "totalAulasProfessor",
      "totalAlunosProfessor", "feedbackProfessor", "linkAdminProfessor"
    ],
    "html/index.html": [
      "agendamentoForm", "mensagemAgendamento", "dataAgendamento", "horaAgendamento",
      "horarioAgendamentoAjuda", "mensalidadeForm", "resultadoMensalidade", "resumoFuncionamento", "funcionamentoRodape"
    ]
  };

  for (const [pagina, ids] of Object.entries(contratos)) {
    const html = ler(pagina);
    ids.forEach((id) => assert.match(html, new RegExp(`id=["']${id}["']`), `${id} ausente em ${pagina}`));
  }
});

test("scripts e folhas de estilo locais referenciados existem", () => {
  for (const pagina of ["html/index.html", "html/admin.html", "html/painel.html", "html/professor.html"]) {
    const html = ler(pagina);
    const referencias = [...html.matchAll(/(?:src|href)="(\.\.\/[^"?#]+)"/g)].map((resultado) => resultado[1]);
    referencias.forEach((referencia) => {
      const destino = resolve(raiz, "html", referencia);
      assert.equal(existsSync(destino), true, `${referencia} não existe (${pagina})`);
    });
  }
});

test("a versão inclui os perfis e fluxos comerciais esperados", () => {
  const regras = ler("firestore.rules");
  assert.match(regras, /match \/configuracoes\/\{configuracaoId\}/);
  assert.match(regras, /match \/auditoria\/\{registroId\}/);
  assert.match(regras, /match \/solicitacoes_privacidade\/\{userId\}/);
  assert.match(regras, /match \/professores_acesso\/\{userId\}/);
  assert.match(regras, /professorUid/);
  assert.match(ler("functions/service.mjs"), /presente/);
  assert.match(ler("functions/domain.mjs"), /lista_espera/);
});

test("a área do professor consulta somente vínculos do próprio UID", () => {
  const modulo = ler("js/professor.js");
  assert.match(modulo, /where\("professorUid", "==", usuario\.uid\)/);
  assert.doesNotMatch(modulo, /collection\(db, "usuarios"\)/);
  assert.match(ler("firestore.rules"), /resource\.data\.get\('professorUid', ''\) == request\.auth\.uid/);
});

test("a página principal não usa manipuladores JavaScript inline", () => {
  assert.doesNotMatch(ler("html/index.html"), /\son[a-z]+=/i);
});
