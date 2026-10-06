import test from "node:test";
import assert from "node:assert/strict";
import { destinoPorPerfil, professorDoHorario } from "../js/perfis.mjs";

test("redireciona cada perfil para a área correta", () => {
  assert.equal(destinoPorPerfil({ administradorAtivo: true, professorAtivo: true }), "admin.html");
  assert.equal(destinoPorPerfil({ professorAtivo: true }), "professor.html");
  assert.equal(destinoPorPerfil({}), "painel.html");
});

test("preserva o retorno ao agendamento após o login", () => {
  assert.equal(destinoPorPerfil({ retorno: "index.html#agendamento", professorAtivo: true }), "index.html#agendamento");
  assert.equal(destinoPorPerfil({ retorno: "agenda.html", professorAtivo: true }), "agenda.html");
});

test("normaliza o vínculo de professor da atividade", () => {
  assert.deepEqual(professorDoHorario({ professorUid: " uid-1 ", professorNome: " Ana " }), { uid: "uid-1", nome: "Ana" });
  assert.deepEqual(professorDoHorario({ professorUid: "uid-1" }), { uid: "", nome: "" });
});
