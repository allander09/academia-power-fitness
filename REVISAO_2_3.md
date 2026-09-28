# Power Fitness 2.3 — roteiro de revisão

Esta versão é uma candidata para avaliação técnica antes da publicação definitiva.

## Objetivo da revisão

Validar se o projeto está bem estruturado para ser apresentado e comercializado como MVP para uma única academia.

## Funcionalidades novas

- funcionamento configurável para cada dia: fechado, 24 horas ou período personalizado;
- atividade ligada aos dias da semana e a uma capacidade máxima;
- confirmação respeitando a capacidade e envio para lista de espera quando lotar;
- promoção da primeira pessoa da fila quando uma vaga confirmada é cancelada;
- download dos dados do aluno;
- solicitação de exclusão e acompanhamento pelo administrador;
- histórico das ações administrativas;
- regras do Firestore adaptadas aos novos dados;
- testes automatizados de lógica e integração estrutural.

## Perguntas para o professor

1. A separação entre `horarios` e `configuracoes/funcionamento` está adequada?
2. Para este MVP, a confirmação administrativa da capacidade é suficiente ou seria exigido um backend transacional?
3. O fluxo de lista de espera está claro para aluno e administrador?
4. A solicitação manual de exclusão atende ao escopo acadêmico ou deve excluir Authentication e Firestore automaticamente?
5. O histórico administrativo possui dados suficientes para suporte e rastreabilidade?
6. Quais itens ele considera obrigatórios antes de cobrar pela instalação e personalização?

## Teste manual sugerido

1. Configurar segunda-feira como 24 horas, sábado das 08:00 às 18:00 e domingo como fechado.
2. Criar uma atividade de sábado com capacidade 2.
3. Cadastrar três alunos verificados e solicitar o mesmo horário.
4. Confirmar os dois primeiros e tentar confirmar o terceiro.
5. Conferir se o terceiro entra na lista de espera.
6. Cancelar uma vaga confirmada e conferir se o primeiro da fila volta para análise.
7. Baixar os dados de um aluno e abrir o arquivo JSON.
8. Enviar uma solicitação de exclusão e marcá-la como atendida no painel.
9. Conferir o histórico administrativo.
10. Repetir em celular e computador.

## Critérios para aprovação

- nenhuma página com erro no Console do navegador;
- aluno comum sem acesso ao painel administrativo;
- dados de um aluno invisíveis para outros alunos;
- horários fora do funcionamento não aparecem para agendamento;
- capacidade e fila apresentam o resultado esperado;
- todas as ações importantes produzem feedback;
- `npm test` e `npm run check` terminam sem falhas.

## Decisões após a revisão

- aprovar ou ajustar a modelagem;
- decidir se a versão 2.3 será mesclada à `main`;
- fechar escopo comercial, preço de implantação e valor da manutenção;
- separar módulos futuros: pagamentos, mensalidades, presença, ficha de treino, notificações e WhatsApp.
