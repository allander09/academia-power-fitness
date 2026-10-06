export const mensagensAuth = {
  "auth/email-already-in-use": "Este e-mail já está cadastrado.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/invalid-email": "Informe um e-mail válido.",
  "auth/missing-password": "Informe sua senha.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
  "auth/user-disabled": "Esta conta está desativada.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/weak-password": "Use uma senha mais forte, conforme os requisitos do cadastro.",
  "auth/network-request-failed": "Sem conexão com a internet."
};

export function mensagemAuth(error, fallback = "Não foi possível concluir a operação.") {
  return mensagensAuth[error?.code] || fallback;
}

export function resultadoRecuperacao(error) {
  if (!error || ["auth/user-not-found", "auth/invalid-credential"].includes(error.code)) {
    return { mensagem: "Se esse e-mail estiver cadastrado, você receberá as instruções.", tipo: "sucesso" };
  }
  return { mensagem: mensagemAuth(error), tipo: "erro" };
}

export function alternarSenha(input, botao) {
  const mostrar = input.type === "password";
  input.type = mostrar ? "text" : "password";
  botao.textContent = mostrar ? "Ocultar senha" : "Mostrar senha";
  botao.setAttribute("aria-pressed", String(mostrar));
}
