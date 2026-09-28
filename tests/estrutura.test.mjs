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
  for (const pagina of ["html/index.html", "html/admin.html", "html/painel.html", "html/login.html", "html/formularios.html"]) {
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
      "horarioCapacidadeAdmin", "totalAlunos", "totalAgendamentos", "totalContatos", "totalPrivacidade"
    ],
    "html/painel.html": [
      "conteudoPainel", "carregando", "perfilForm", "listaAgendamentos", "exportarDados",
      "solicitarExclusao", "feedbackPrivacidade", "linkAdmin", "reenviarVerificacao"
    ],
    "html/index.html": [
      "agendamentoForm", "mensagemAgendamento", "dataAgendamento", "horaAgendamento",
      "horarioAgendamentoAjuda", "resumoFuncionamento", "funcionamentoRodape"
    ]
  };

  for (const [pagina, ids] of Object.entries(contratos)) {
    const html = ler(pagina);
    ids.forEach((id) => assert.match(html, new RegExp(`id=["']${id}["']`), `${id} ausente em ${pagina}`));
  }
});

test("scripts e folhas de estilo locais referenciados existem", () => {
  for (const pagina of ["html/index.html", "html/admin.html", "html/painel.html"]) {
    const html = ler(pagina);
    const referencias = [...html.matchAll(/(?:src|href)="(\.\.\/[^"?#]+)"/g)].map((resultado) => resultado[1]);
    referencias.forEach((referencia) => {
      const destino = resolve(raiz, "html", referencia);
      assert.equal(existsSync(destino), true, `${referencia} não existe (${pagina})`);
    });
  }
});

test("a versão 2.3 inclui as coleções e status comerciais esperados", () => {
  const regras = ler("firestore.rules");
  assert.match(regras, /match \/configuracoes\/\{configuracaoId\}/);
  assert.match(regras, /match \/auditoria\/\{registroId\}/);
  assert.match(regras, /match \/solicitacoes_privacidade\/\{userId\}/);
  assert.match(regras, /lista_espera/);
});
