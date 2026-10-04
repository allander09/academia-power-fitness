export const STATUS_ATIVOS = ["pendente", "confirmado", "lista_espera"];

export function dataHoraFutura(data, hora, agora = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "") || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora || "")) return false;
  const valor = new Date(`${data}T${hora}:00-03:00`);
  const calendario = new Date(`${data}T00:00:00Z`);
  return Number.isFinite(valor.getTime()) && Number.isFinite(calendario.getTime()) && calendario.toISOString().slice(0, 10) === data && valor > agora;
}

export function diaDaData(data) {
  return new Date(`${data}T12:00:00-03:00`).getUTCDay();
}

export function atividadeDisponivel(horario, data, funcionamento = {}) {
  if (!horario || horario.ativo !== true) return false;
  const indice = diaDaData(data);
  if (!(horario.diasSemana || [1, 2, 3, 4, 5, 6]).includes(indice)) return false;
  const ids = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const padrao = indice === 0 ? { modo: "fechado" } : {
    modo: "personalizado", abertura: indice === 6 ? "08:00" : "06:00", fechamento: indice === 6 ? "14:00" : "22:00"
  };
  const regra = funcionamento.dias?.[ids[indice]] || padrao;
  return regra.modo === "24h" || (regra.modo === "personalizado" && horario.hora >= regra.abertura && horario.hora < regra.fechamento);
}

export function dadosParaProfessor(dados) {
  return Object.fromEntries(["aulaId", "nome", "data", "hora", "atividade", "status", "presenca"].map(campo => [campo, dados[campo] || (campo === "presenca" ? "nao_registrada" : "")]));
}

export function decidirStatus(dados, status, turma, capacidade) {
  if (status === "confirmado") {
    if (dados.status === "confirmado") return "confirmado";
    if (!["pendente", "lista_espera"].includes(dados.status)) throw new Error("Esta solicitação não pode ser confirmada.");
    return turma.filter(item => item.status === "confirmado").length >= capacidade ? "lista_espera" : "confirmado";
  }
  if (!["cancelado", "recusado"].includes(status) || !STATUS_ATIVOS.includes(dados.status)) throw new Error("Alteração de status inválida.");
  if (status === "recusado" && dados.status === "confirmado") throw new Error("Cancele uma aula já confirmada.");
  return status;
}
