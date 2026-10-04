# Power Fitness 2.5 — validação e aceitação

## Mudanças concluídas no código

- Conta no cabeçalho com iniciais, nome, e-mail, perfil, acesso ao painel e saída.
- Mantidas áreas separadas para aluno, professor e administrador.
- Correção do primeiro acesso do aluno com e-mail ainda não verificado.
- Capacidade transacional no servidor e validação de solicitações duplicadas, inclusive antigas.
- Cancelamento disponível para pedidos na fila; liberação de vaga promove a fila no servidor.
- Professor recebe resposta mínima sem e-mail, UID, plano ou identificador derivado da conta.
- Presença e alteração de responsável verificadas no servidor.
- Mudança de hora com reserva futura e redução abaixo da ocupação recusadas.
- Exportação ampliada para contatos vinculados e pedidos de privacidade.
- Exclusão administrativa executa a remoção da conta/dados, permite retomar falha intermediária e agenda descarte do bloqueio técnico por TTL após a conclusão.
- Ciência da política persistida com versão e horário; identificação e prazos configuráveis.
- Planos administrativos alimentam também os dois seletores; conteúdo totalmente desativado não ressuscita os cards antigos.
- Código interno, documentos e dependências excluídos do Hosting.
- Documentação de venda sem pacote obrigatório de suporte.
- Demonstração local completa com contas fictícias dos três perfis, sem login no Firebase ou faturamento.
- Corrigida a remoção de `index.html` pelo Hosting, que podia fazer os links relativos apontarem para a raiz errada. A configuração agora preserva as URLs HTML.
- Menu da conta aguarda o carregamento do perfil antes de permitir abertura.

## Evidências locais

- 30 testes de lógica e estrutura: aprovados, incluindo a separação entre ambiente local e produção.
- 16 testes de integração no Firestore/Authentication Emulator Suite: aprovados, incluindo confirmações concorrentes, negação de acesso, presença, duplicidade e exclusão. Outros cinco testes verificam o protocolo HTTP das funções e a navegação no Hosting.
- Interface executada em navegador headless com respostas Firebase simuladas: IMC, planos dinâmicos, simulador, seleção de plano, menu da conta, teclado, saída, painéis e estado sem planos aprovados.
- Interface também executada com o SDK Firebase 12.17.1 real e os emuladores: login dos três perfis, primeiro acesso sem verificação, perfil persistido após recarga, reserva pelo navegador, capacidade pelo administrador e presença pelo professor aprovados. Os módulos oficiais foram mantidos em cache local no ensaio; as respostas de dados não foram simuladas.
- Larguras 1440, 1024, 901, 900 e 390 px sem transbordamento horizontal; capturas de desktop, conta no celular, administração e professor inspecionadas.
- Sintaxe do frontend, servidor e scripts: aprovada.
- Auditoria das dependências de produção do servidor: zero vulnerabilidades conhecidas na execução da revisão (resultado pontual; reavaliar em futuras atualizações).
- Imagens do repositório restauradas na cópia de trabalho e decodificadas sem erros. Não foi necessário alterar os arquivos remotos de imagem.

A execução local de Functions neste ambiente precisou de um ajuste temporário de transporte interno da CLI (TCP no lugar de socket Unix indisponível). Esse ajuste não faz parte do repositório; a validação no GitHub executa a CLI original com Node.js 22/Java 21. App Check real permanece uma etapa exclusiva da aceitação em produção.

Para reproduzir a demonstração local, consulte [TESTAR.md](TESTAR.md). Roteiro manual abaixo ainda precisa ser executado no projeto de destino. Não houve publicação no Firebase nesta revisão: a CLI não estava autenticada e o acesso ao Console nesta sessão encontrou erro de conexão na página de login do Google.

## Roteiro no domínio publicado

| Passo | Resultado esperado |
|---|---|
| Cadastro válido | Perfil salvo, ciência registrada e link de verificação enviado |
| Primeiro acesso sem verificação | Painel do aluno abre e permite reenviar o link |
| Recuperação de senha | Mensagem genérica e envio na conta existente |
| Login dos três perfis | Painel correspondente; permissão indevida recusada |
| Conta no cabeçalho | Nome/conta corretos; menu acessível com teclado; saída funciona |
| IMC 75,5 / 1,75 | Resultado numérico e classificação informativa |
| IMC inválido | Mensagem de erro clara |
| Editar plano e preço | Card, simulador e seletor de interesse acompanham a publicação |
| Desativar todos os planos | Mensagem sem planos; simulador desabilitado |
| Dia fechado/data passada | Solicitação recusada |
| Duplo clique/duas abas | Só uma solicitação ativa do aluno na mesma data/hora |
| Confirmar em duas sessões | Capacidade permanece respeitada e excedente vai para fila |
| Cancelar reserva confirmada | Primeira pessoa da fila volta para análise |
| Professor de outra turma | Não recebe dados nem altera presença |
| Professor responsável | Só campos mínimos e presença em reserva confirmada |
| Reatribuir atividade | Reservas futuras ativas acompanham o novo responsável |
| Exportar dados | JSON abre e reúne os registros vinculados à conta |
| Exclusão em conta fictícia | Conta/dados ativos removidos, protocolo e bloqueio da sessão antiga |
| Voltar após exclusão interrompida | Admin retoma operação pelo pedido em processamento |
| Desktop e celular | Cabeçalho, menu, tabela e formulários utilizáveis sem corte |
| Rede indisponível/App Check inválido | Operação protegida não é confirmada indevidamente |

## Critérios de entrega

Aceitar somente após identidade/canal reais, conteúdo correto, projeto do comprador, administrador funcional, Functions/regras/Hosting publicados e testes manuais registrados. Configuração de App Check, faturamento, backups e e-mails deve ser conferida na conta real. A LGPD depende também da operação e documentação do controlador; esta revisão não é certificação jurídica.
