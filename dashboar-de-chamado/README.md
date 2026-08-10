# Dashboard de Chamados de Suporte Técnico

Projeto acadêmico desenvolvido com HTML, CSS, JavaScript e JSON.

## Objetivo

Criar um painel para acompanhar chamados nos status **Aberto**, **Em andamento** e **Finalizado**.

## Funcionalidades

- Três colunas de status.
- Cards gerados dinamicamente pelo JavaScript.
- Cores e badges diferentes por status.
- Prioridades Baixa, Média, Alta e Crítica.
- Botão para avançar o status.
- Botão para voltar ao status anterior.
- Contadores atualizados automaticamente.
- Busca por título, responsável ou setor.
- Filtro por prioridade.
- Layout responsivo.
- Dados iniciais carregados de `chamados.json`.
- Persistência das alterações com `localStorage`.
- Botão para restaurar os dados originais.

## Camada de dados simulada

O requisito original prevê atualização por API usando PUT/PATCH. Nesta versão, o arquivo `chamados.json` funciona como fonte inicial e o `localStorage` simula a persistência das alterações feitas no navegador.

Exemplo conceitual de uma atualização real:

```http
PATCH /api/chamados/1
Content-Type: application/json

{
  "status": "andamento"
}
```

## Como executar

Use um servidor local porque o JavaScript utiliza `fetch()` para ler o arquivo JSON.

No VS Code:

1. Abra a pasta `dashboar-de-chamado`.
2. Instale a extensão Live Server, caso ainda não tenha.
3. Clique com o botão direito em `index.html`.
4. Escolha **Open with Live Server**.

## Critérios atendidos

- Respostas conceituais e explicação técnica no README.
- HTML semântico e organizado.
- CSS responsivo.
- JavaScript com tratamento assíncrono através de `async/await` e `fetch()`.
- Integração simulada com camada de dados usando JSON + localStorage.
- Contadores recalculados a cada alteração.
