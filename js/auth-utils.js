export const mensagensAuth = {
  "auth/email-already-in-use": "Este e-mail já está cadastrado.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/invalid-email": "Informe um e-mail válido.",
  "auth/missing-password": "Informe sua senha.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
  "auth/user-disabled": "Esta conta está desativada.",
  "auth/user-not-found": "Nenhuma conta foi encontrada com esse e-mail.",
  "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
  "auth/network-request-failed": "Sem conexão com a internet."
};

export function mensagemAuth(error, fallback = "Não foi possível concluir a operação.") {
  return mensagensAuth[error?.code] || fallback;
}

export function alternarSenha(input, botao) {
  const mostrar = input.type === "password";
  input.type = mostrar ? "text" : "password";
  botao.textContent = mostrar ? "Ocultar senha" : "Mostrar senha";
  botao.setAttribute("aria-pressed", String(mostrar));
}
