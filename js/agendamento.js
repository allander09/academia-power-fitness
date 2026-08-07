function configurarAgendamento() {
  const form = document.getElementById("agendamentoForm");
  if (!form) return;

  const data = form.querySelector('input[type="date"]');
  const mensagem = document.getElementById("mensagemAgendamento") || document.getElementById("msg");
  const hoje = new Date().toISOString().split("T")[0];
  data.min = hoje;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nome = form.querySelector('[name="nome"]').value.trim();
    const email = form.querySelector('[name="email"]')?.value.trim();
    const dataSelecionada = data.value;

    if (!nome || !dataSelecionada || (email !== undefined && !email)) {
      mensagem.textContent = "Preencha todos os campos obrigatórios.";
      mensagem.className = "mensagem erro";
      return;
    }

    if (dataSelecionada < hoje) {
      mensagem.textContent = "Escolha uma data a partir de hoje.";
      mensagem.className = "mensagem erro";
      return;
    }

    mensagem.textContent = "Solicitação de aula experimental registrada!";
    mensagem.className = "mensagem sucesso";
    form.reset();
    data.min = hoje;
  });
}

document.addEventListener("DOMContentLoaded", configurarAgendamento);
