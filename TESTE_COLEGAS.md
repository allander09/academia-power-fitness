# Avaliação do Power Fitness com colegas

## Antes de compartilhar

O endereço da instalação original é https://powerfitness-2a4a4.web.app/. A existência desse endereço não comprova que a revisão atual está publicada. O teste local em `127.0.0.1` funciona apenas no computador que iniciou os emuladores.

Para liberar os novos recursos no link público, concluir no projeto real:

1. Login da CLI Firebase com a conta autorizada e conferência do projeto `powerfitness-2a4a4`.
2. Plano Blaze necessário para Functions, revisado pelo titular; domínio autorizado e App Check configurado.
3. Backup e migração de dados antigos quando necessário, conforme `ENTREGA.md`.
4. Publicação de Functions, Firestore e Hosting, nessa ordem; índice da agenda pronto.
5. Teste no domínio real: cadastro, verificação/recuperação de e-mail, login, solicitação de aula e permissão administrativa. Preparar conteúdo e identificação/canal de privacidade antes de coletar dados reais.

Enquanto os perfis privilegiados estiverem pendentes, os colegas podem avaliar o site público. Não anunciar que professor/admin já foram validados na instalação real. Cada pessoa usa sua conta para testar o cadastro; senhas de emuladores não funcionam no site público e contas administrativas não devem ser compartilhadas. Fotos, nomes de alunos e dados sensíveis não devem ser usados para simular turmas.

## Roteiro para o avaliador

| Teste | Resultado esperado |
|---|---|
| Abrir no celular e computador | Menu legível, navegação funcionando e conteúdo sem corte |
| Clicar em planos | Logo visível, informações carregadas e interesse do plano selecionado |
| Conferir horários | Quadro compacto no desktop e legível no celular |
| IMC com `75,5` e `1,75` | Resultado `24.65` e classificação informativa |
| IMC com campo vazio ou altura zero | Mensagem de erro, sem cálculo inválido |
| Simular dois meses | Valor corresponde ao plano publicado, multiplicado por dois |
| Abrir um link antigo, como `/html/imc.html` | Encaminhamento para a calculadora funcional |
| Entrar na própria conta, quando liberado | Perfil no topo, painel do aluno e saída funcionando |
| Solicitar aula, quando liberado | E-mail verificado, data futura e confirmação de salvamento |
| Tentar entrar em administração como aluno | Acesso negado e nenhum dado administrativo exibido |

Professor e administrador devem ser testados separadamente pelo responsável, com contas individuais autorizadas. O teste público não substitui o roteiro completo de `REVISAO_2_5.md` nem a aceitação comercial.

## Como relatar um problema

Registrar: dispositivo/navegador, página, passos, resultado esperado, resultado obtido e mensagem de erro. Anexar uma captura sem senha ou dados de terceiros. Classificar o registro como erro que impede uma operação, problema visual ou sugestão de melhoria. Anotar o commit publicado, data e responsável pelo teste.

Só divulgar o link como revisão final depois de confirmar que os recursos novos estão no domínio público. Contas privilegiadas temporárias devem ter o acesso revogado ao encerrar a avaliação.
