import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gerarApresentacao } from "../scripts/gerar-apresentacao.mjs";

test("apresentação gratuita exporta apenas a vitrine e cálculos locais", async () => {
  const destino = await mkdtemp(join(tmpdir(), "power-apresentacao-"));
  try {
    await gerarApresentacao(destino);
    const html = await readFile(join(destino, "html/index.html"), "utf8");
    assert.deepEqual((await readdir(join(destino, "js"))).sort(), ["calculos.mjs", "imc.js", "mensalidade.js", "modal.js", "script.js"]);
    assert.deepEqual([...html.matchAll(/<form id="([^\"]+)"/g)].map(m => m[1]), ["imcForm", "mensalidadeForm"]);
    assert.doesNotMatch(html, /firebase(?:-services|-config|js)|gstatic|login\.html|formularios\.html|type="(?:email|password|tel)"/i);
    assert.doesNotMatch(html, /(?:src|href)="https?:/);
    assert.equal([...html.matchAll(/class="perfil-apresentacao"/g)].length, 3);
    assert.equal([...html.matchAll(/class="plano(?: destaque-plano)?"/g)].length, 3);
    for (const id of ["aluno", "professor", "admin"]) assert.ok((await stat(join(destino, `assets/apresentacao/painel-${id}.jpg`))).size > 1000);
    for (const js of await readdir(join(destino, "js"))) {
      assert.doesNotMatch(await readFile(join(destino, "js", js), "utf8"), /firebase|fetch\s*\(|XMLHttpRequest/);
    }
    const ids = new Set([...html.matchAll(/\bid="([^\"]+)"/g)].map(m => m[1]));
    for (const [, id] of html.matchAll(/href="#([^\"]+)"/g)) assert.ok(ids.has(id), `Âncora inexistente: ${id}`);
    for (const [, caminho] of html.matchAll(/(?:src|href)="(\.\.\/[^\"]+)"/g)) assert.ok((await stat(join(destino, "html", caminho))).isFile(), caminho);
    const config = JSON.parse(await readFile(new URL("../firebase.apresentacao.json", import.meta.url)));
    assert.deepEqual(Object.keys(config), ["hosting"]);
    assert.equal(config.hosting.public, "dist-apresentacao");
    assert.ok(config.hosting.headers[0].headers.some(h => h.key === "Content-Security-Policy" && h.value.includes("connect-src 'none'")));
  } finally { await rm(destino, { recursive: true, force: true }); }
});
