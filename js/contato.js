function configurarContato() {
  const form = document.getElementById("formContato");
  if (!form) return;

  const retorno = document.getElementById("retorno") || document.getElementById("mensagemContato");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nome = form.querySelector('[name="nome"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const mensagem = form.querySelector('[name="mensagem"]').value.trim();

    if (!nome || !email || !mensagem) {
      retorno.textContent = "Preencha nome, e-mail e mensagem.";
      retorno.className = "mensagem erro";
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    retorno.textContent = "Mensagem registrada neste dispositivo.";
    retorno.className = "mensagem sucesso";
    sessionStorage.setItem("powerFitnessUltimoContato", JSON.stringify({ nome, email, mensagem }));
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", configurarContato);
