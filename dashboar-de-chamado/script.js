const CHAVE_STORAGE = 'dashboardChamados';
let chamados = [];

const elementos = {
  listaAberto: document.getElementById('lista-aberto'),
  listaAndamento: document.getElementById('lista-andamento'),
  listaFinalizado: document.getElementById('lista-finalizado'),
  contadorTotal: document.getElementById('contador-total'),
  contadorAberto: document.getElementById('contador-aberto'),
  contadorAndamento: document.getElementById('contador-andamento'),
  contadorFinalizado: document.getElementById('contador-finalizado'),
  badgeAberto: document.getElementById('badge-aberto'),
  badgeAndamento: document.getElementById('badge-andamento'),
  badgeFinalizado: document.getElementById('badge-finalizado'),
  busca: document.getElementById('busca'),
  filtroPrioridade: document.getElementById('filtro-prioridade'),
  btnResetar: document.getElementById('btn-resetar'),
  toast: document.getElementById('toast')
};

document.addEventListener('DOMContentLoaded', iniciarDashboard);

async function iniciarDashboard() {
  adicionarEventos();
  try {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);
    chamados = dadosSalvos ? JSON.parse(dadosSalvos) : await carregarChamadosDoJSON();
    persistirChamados();
    renderizarDashboard();
  } catch (erro) {
    console.error(erro);
    elementos.listaAberto.innerHTML = '<div class="estado-vazio">Não foi possível carregar os chamados. Execute com Live Server.</div>';
  }
}

function adicionarEventos() {
  elementos.busca.addEventListener('input', renderizarDashboard);
  elementos.filtroPrioridade.addEventListener('change', renderizarDashboard);
  elementos.btnResetar.addEventListener('click', resetarDados);
}

async function carregarChamadosDoJSON() {
  const resposta = await fetch('chamados.json');
  if (!resposta.ok) throw new Error('Erro ao carregar chamados.json');
  return await resposta.json();
}

// Simulação equivalente a uma atualização PATCH/PUT em API.
// O JSON fornece os dados iniciais e o localStorage persiste as alterações no navegador.
function persistirChamados() {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(chamados));
}

function renderizarDashboard() {
  const termo = elementos.busca.value.trim().toLowerCase();
  const prioridade = elementos.filtroPrioridade.value;

  const filtrados = chamados.filter(chamado => {
    const busca = chamado.titulo.toLowerCase().includes(termo) ||
      chamado.responsavel.toLowerCase().includes(termo) ||
      chamado.setor.toLowerCase().includes(termo);
    const filtro = prioridade === 'todas' || chamado.prioridade === prioridade;
    return busca && filtro;
  });

  renderizarColuna(elementos.listaAberto, filtrados.filter(c => c.status === 'aberto'));
  renderizarColuna(elementos.listaAndamento, filtrados.filter(c => c.status === 'andamento'));
  renderizarColuna(elementos.listaFinalizado, filtrados.filter(c => c.status === 'finalizado'));
  atualizarContadores();
}

function renderizarColuna(elemento, lista) {
  elemento.innerHTML = '';
  if (!lista.length) {
    elemento.innerHTML = '<div class="estado-vazio">Nenhum chamado nesta coluna.</div>';
    return;
  }
  lista.forEach(chamado => elemento.appendChild(criarCardChamado(chamado)));
}

function criarCardChamado(chamado) {
  const nomesStatus = {aberto:'Aberto', andamento:'Em andamento', finalizado:'Finalizado'};
  const classePrioridade = removerAcentos(chamado.prioridade.toLowerCase());
  const card = document.createElement('article');
  card.className = 'card-chamado';
  card.innerHTML = `
    <div class="card-topo">
      <div><span class="card-id">#${String(chamado.id).padStart(3,'0')}</span><h3>${escaparHTML(chamado.titulo)}</h3></div>
      <span class="badge status-${chamado.status}">${nomesStatus[chamado.status]}</span>
    </div>
    <p class="card-descricao">${escaparHTML(chamado.descricao)}</p>
    <div class="card-detalhes">
      <span><strong>Responsável:</strong> ${escaparHTML(chamado.responsavel)}</span>
      <span><strong>Setor:</strong> ${escaparHTML(chamado.setor)}</span>
      <span><strong>Aberto em:</strong> ${formatarData(chamado.dataAbertura)}</span>
    </div>
    <div class="card-badges"><span class="badge prioridade-${classePrioridade}">Prioridade ${escaparHTML(chamado.prioridade)}</span></div>
    <div class="card-acoes">
      ${chamado.status !== 'aberto' ? `<button class="btn btn-voltar" data-acao="voltar" data-id="${chamado.id}" type="button">Voltar</button>` : ''}
      ${chamado.status !== 'finalizado' ? `<button class="btn btn-primario" data-acao="avancar" data-id="${chamado.id}" type="button">Avançar status</button>` : ''}
    </div>`;

  card.querySelectorAll('button').forEach(botao => {
    botao.addEventListener('click', () => {
      const id = Number(botao.dataset.id);
      botao.dataset.acao === 'avancar' ? avancarStatus(id) : voltarStatus(id);
    });
  });
  return card;
}

function avancarStatus(id) {
  const chamado = chamados.find(c => c.id === id);
  if (!chamado) return;
  if (chamado.status === 'aberto') chamado.status = 'andamento';
  else if (chamado.status === 'andamento') chamado.status = 'finalizado';
  else return;
  salvarAlteracao(chamado, 'Status atualizado com sucesso.');
}

function voltarStatus(id) {
  const chamado = chamados.find(c => c.id === id);
  if (!chamado) return;
  if (chamado.status === 'finalizado') chamado.status = 'andamento';
  else if (chamado.status === 'andamento') chamado.status = 'aberto';
  else return;
  salvarAlteracao(chamado, 'Chamado movido para o status anterior.');
}

function salvarAlteracao(chamado, mensagem) {
  persistirChamados();
  renderizarDashboard();
  mostrarToast(`${mensagem} Chamado #${String(chamado.id).padStart(3,'0')}.`);
}

function atualizarContadores() {
  const abertos = chamados.filter(c => c.status === 'aberto').length;
  const andamento = chamados.filter(c => c.status === 'andamento').length;
  const finalizados = chamados.filter(c => c.status === 'finalizado').length;
  elementos.contadorTotal.textContent = chamados.length;
  elementos.contadorAberto.textContent = abertos;
  elementos.contadorAndamento.textContent = andamento;
  elementos.contadorFinalizado.textContent = finalizados;
  elementos.badgeAberto.textContent = abertos;
  elementos.badgeAndamento.textContent = andamento;
  elementos.badgeFinalizado.textContent = finalizados;
}

async function resetarDados() {
  if (!confirm('Deseja restaurar os dados originais do JSON?')) return;
  chamados = await carregarChamadosDoJSON();
  persistirChamados();
  elementos.busca.value = '';
  elementos.filtroPrioridade.value = 'todas';
  renderizarDashboard();
  mostrarToast('Dados restaurados com sucesso.');
}

function mostrarToast(mensagem) {
  elementos.toast.textContent = mensagem;
  elementos.toast.classList.add('visivel');
  clearTimeout(mostrarToast.timeout);
  mostrarToast.timeout = setTimeout(() => elementos.toast.classList.remove('visivel'), 2300);
}

function formatarData(dataISO) {
  return new Date(`${dataISO}T12:00:00`).toLocaleDateString('pt-BR');
}
function removerAcentos(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
