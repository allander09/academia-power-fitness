# Power Fitness — documentação funcional 2.5

## Telas e perfis

| Perfil | Tela | Operações |
|---|---|---|
| Público | `html/index.html` | Informações, planos, equipe, horários, IMC, simulação, contato |
| Conta | `html/login.html`, `html/formularios.html` | Cadastro, login, recuperação, verificação de e-mail |
| Aluno | `html/painel.html` | Perfil, próprios agendamentos, cancelamento, exportação e pedido de exclusão |
| Professor | `html/professor.html` | Atividades atribuídas, alunos vinculados e presença |
| Administrador | `html/admin.html` | Conteúdo, alunos, professores, agenda, fila, privacidade e auditoria |

O cabeçalho público mostra Entrar ou as iniciais da conta. O menu da conta oferece o painel do perfil, perfil e privacidade e saída. A prioridade do login é administrador, professor e aluno. Um login iniciado pelo agendamento retorna ao formulário.

Os endereços antigos `agenda.html`, `contato.html`, `horarios.html`, `imc.html`, `planos.html` e `professores.html` encaminham para a seção correspondente da página principal, onde estão os formulários e o conteúdo atuais.

## Autorização

Uma conta de aluno não pode escolher papéis privilegiados. O primeiro administrador é autorizado no Console Firestore por `admins/{UID}` com `ativo: true`. Professores são autorizados por administrador em `professores_acesso/{UID}`; precisam verificar o e-mail. Dados próprios podem ser lidos antes da verificação, para permitir o primeiro acesso e reenvio do link. As operações críticas exigem verificação.

## Agendamento

1. A página carrega as atividades ativas e o funcionamento real.
2. O aluno seleciona data, atividade e plano de interesse.
3. `solicitarAgendamento` valida identidade, perfil, data futura no fuso brasileiro, atividade ativa, dia, horário e plano. O plano deve estar publicado e ativo; a opção `Ainda não decidi` também é aceita. Nome e e-mail vêm da conta.
4. O ID usa `UID_data_hora`; uma transação também verifica solicitações antigas do aluno para impedir duplicidade.
5. O pedido começa como `pendente` e não ocupa uma vaga confirmada.
6. `alterarAgendamento` confirma somente pedidos pendentes ou na fila, conferindo a capacidade da atividade no servidor.
7. A turma usa um documento de coordenação por data e atividade; confirmações simultâneas não podem consumir a mesma última vaga.
8. Quando não há vaga, o pedido vira `lista_espera`.
9. Cancelar uma reserva confirmada promove o primeiro pedido da fila para `pendente`. A academia confirma a nova vaga.
10. Presença só pode ser registrada em reserva confirmada pelo professor vinculado ou administrador.

Capacidade pertence a cada atividade, inclusive quando duas atividades têm a mesma hora. Uma pessoa não pode ter duas solicitações ativas no mesmo horário. Não existe garantia de vaga na solicitação. Não existe controle de duração/sobreposição entre horários diferentes.

## Alterações da atividade

`salvarHorario` valida os campos e o responsável, grava a atividade e sincroniza o professor e o nome da atividade dos agendamentos futuros ativos na mesma transação. Uma hora com reservas futuras não pode ser alterada antes do cancelamento dessas reservas. A capacidade não pode ficar abaixo das reservas confirmadas. Mudanças com mais de 350 reservas futuras exigem migração assistida para respeitar limites da transação. Desativar uma atividade bloqueia novas solicitações; a equipe deve tratar as reservas existentes.

Planos publicados alimentam os cards, a simulação de mensalidade e o formulário de interesse. Quando não existe conteúdo ativo, a página informa isso. Uma falha de carregamento não deve ser interpretada como atualização de preços confirmada; confirme o conteúdo no projeto de destino.

A página inicia com estados de carregamento, sem preços e equipe fictícios como fallback. Falhas ao carregar planos, equipe e funcionamento são informadas. Falhas de autenticação/rede no agendamento restauram o botão e não são exibidas como sucesso. Recuperação de senha não revela pela mensagem se o e-mail está cadastrado, inclusive quando o provedor retorna conta inexistente.

## Dados

| Coleção/documento | Uso e acesso |
|---|---|
| `usuarios/{UID}` | Perfil, registro de ciência e timestamps; titular e administrador |
| `admins/{UID}` | Permissão administrativa; bootstrap/revogação no Console |
| `professores_acesso/{UID}` | Permissão de professor; manutenção por administrador |
| `agendamentos` | Reservas; aluno proprietário e administrador leem documentos; servidor altera |
| `turmas` | Coordenação transacional; só servidor |
| `contatos` | Mensagens e ciência de privacidade; leitura administrativa |
| `planos`, `professores`, `horarios` | Conteúdo ativo público; atividades alteradas pelo servidor |
| `configuracoes/funcionamento` | Funcionamento semanal e capacidade padrão |
| `configuracoes/privacidade` | Controlador, canal e prazos de revisão configuráveis |
| `solicitacoes_privacidade/{UID}` | Pedido pendente ou em processamento |
| `exclusoes/{UID}` | Bloqueio técnico da conta durante e após a exclusão |
| `comprovantes_privacidade` | Protocolo sem nome ou e-mail da conta excluída |
| `auditoria` | Histórico protegido de alterações |

O professor recebe pela função apenas `aulaId`, nome, atividade, data, hora, status e presença. `aulaId` é aleatório, sem UID do aluno; documentos antigos recebem esse identificador no servidor. O professor não lê o documento de agendamento, e-mail, telefone, plano, perfil completo nem auditoria.

## Privacidade e exclusão

Cadastro e contato registram versão da política e timestamp de ciência. Esse registro não constitui autorização de marketing. A identificação real da academia é configurada no painel. Até a configuração revisada, o site exibe aviso de demonstração.

A exportação reúne conta, perfil, reservas, contatos vinculados ao UID, pedido de privacidade e eventual acesso de professor. Contatos enviados sem login, registros complementares e documentos externos são tratados pelo canal de privacidade após conferência de identidade.

O administrador analisa o pedido e eventuais obrigações de conservação antes de usar Excluir conta e dados. A operação bloqueia e desativa a conta, cancela/remove as reservas, trata a fila, remove contatos vinculados ao UID/e-mail e os registros de auditoria associados, limpa permissões e vínculos de professor, remove o perfil e exclui a conta Authentication. O comprovante contém protocolo, tipo, data e administrador executor. Não existe apenas uma troca para “atendida”.

Uma falha intermediária deixa o pedido como `processando` e a conta bloqueada. O administrador pode retomar. A exclusão entre Auth e Firestore é retomável, não uma transação única entre os dois serviços. Backups, logs de fornecedor e imagens/perfil público do profissional exigem os procedimentos de entrega. A aplicação não elimina dados externos nem determina sozinha obrigações legais.

O bloqueio de sessão antiga permanece por segurança; seu prazo mínimo é 24 horas. O TTL declarado no Firestore elimina bloqueios concluídos após a expiração (a execução do fornecedor é assíncrona). Pedidos interrompidos não recebem expiração antes da conclusão. A revisão dos demais prazos de conservação segue a rotina descrita em ENTREGA.md. Peso e altura do IMC não são persistidos.

## Arquitetura e validação

Frontend estático com SDK Firebase modular 12.17.1; Functions em Node.js 22, região `southamerica-east1`, App Check obrigatório e autenticação verificada nas operações críticas. A região das funções não altera automaticamente a região de Auth ou do banco existente. Firestore Rules impedem escrita direta nas reservas e atividades.

`npm run check` verifica a sintaxe de site/servidor/scripts. `npm test` verifica cálculo, datas, regras de decisão e estrutura. `npm run test:integration` executa cenários com Firestore e Authentication emulados, incluindo isolamento, falsificação, duplicidade, concorrência, presença e exclusão. Consulte REVISAO_2_5.md para aceitação e limites.
