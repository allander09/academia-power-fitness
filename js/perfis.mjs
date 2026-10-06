export function destinoPorPerfil({ retorno = "", administradorAtivo = false, professorAtivo = false } = {}) {
  if (["index.html#agendamento", "agenda.html"].includes(retorno)) return retorno;
  if (administradorAtivo) return "admin.html";
  if (professorAtivo) return "professor.html";
  return "painel.html";
}

export function professorDoHorario(horario = {}) {
  const uid = typeof horario.professorUid === "string" ? horario.professorUid.trim() : "";
  const nome = typeof horario.professorNome === "string" ? horario.professorNome.trim() : "";
  return uid && nome ? { uid, nome } : { uid: "", nome: "" };
}
