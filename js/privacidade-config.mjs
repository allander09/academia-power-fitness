export const VERSAO_PRIVACIDADE = "2026-10-04";
export const PRAZOS_PRIVACIDADE = { agendamentosDias: 180, contatosDias: 90, auditoriaDias: 365 };

export function politicaConfigurada(dados) {
  return dados?.publicada === true && ["controladorNome", "controladorDocumento", "controladorEndereco", "emailPrivacidade"].every(campo => typeof dados[campo] === "string" && dados[campo].trim().length > 2);
}
