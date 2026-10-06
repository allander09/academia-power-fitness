# Power Fitness 2.5

Para a apresentação gratuita, siga [APRESENTAR.md](APRESENTAR.md). A vitrine pública usa arquivos estáticos e capturas fictícias dos três painéis; os perfis interativos completos podem ser demonstrados nos emuladores conforme [TESTAR.md](TESTAR.md).

Sistema web para apresentação da academia, solicitação de aulas experimentais e operação de uma única academia. Desenvolvido com HTML, CSS, JavaScript e Firebase, com painéis separados para aluno, professor e administrador.

## Funcionalidades

- Site público com serviços, planos, equipe, galeria, horários e contato.
- IMC com vírgula ou ponto decimal e simulador ligado aos planos publicados.
- Conta no cabeçalho, painel por perfil e saída da sessão.
- Cadastro, verificação de e-mail, recuperação de senha e atualização do perfil.
- Agendamento validado no servidor, plano publicado ou interesse ainda não definido, proteção contra duplicidade e confirmação transacional de vagas.
- Lista de espera; cancelamento pelo aluno ou administrador devolve a primeira pessoa da fila para análise.
- Professor com atividades próprias e presença, recebendo apenas os campos necessários e identificador aleatório da aula.
- Administração de planos, equipe, atividades, capacidade, funcionamento e permissões dos professores.
- Exportação de dados vinculados à conta, pedido de exclusão e execução administrativa da exclusão no banco ativo e Authentication.
- Identificação do controlador e prazos de revisão de dados configuráveis no painel.
- Auditoria das operações e testes de regras, concorrência e autenticação no Firebase Emulator Suite.

## Instalação e verificação

Requisitos: Node.js 22 e Java 21 para os emuladores.

```bash
npm ci
npm ci --prefix functions
npm run check
npm test
npm run test:integration
```

Para testar o site completo sem credenciais de produção, execute `npm run demo` e abra `http://127.0.0.1:5000/html/`. A carga inicial fornece contas fictícias dos três perfis e reservas para testar a fila. Veja [TESTAR.md](TESTAR.md) para as contas, o clone no VS Code e o roteiro. Os testes usam exclusivamente o projeto `demo-power-fitness` nos emuladores.

Live Server em outra porta continua ligado ao projeto real e exige o token de desenvolvimento registrado no App Check. `file://` não executa corretamente os módulos. A demonstração local não substitui os testes no domínio publicado.

## Implantação

Leia [ENTREGA.md](ENTREGA.md) antes de publicar e faça backup/migração quando houver dados antigos. Esta versão inclui **Cloud Functions** e precisa do plano **Blaze** para a implantação das funções. Custos de infraestrutura pertencem ao titular da conta Firebase, conforme uso; alertas de orçamento não são um bloqueio automático de gastos. Publique nesta ordem e execute a aceitação após a atualização completa.

```bash
npx firebase login
npx firebase deploy --project powerfitness-2a4a4 --only functions
npx firebase deploy --project powerfitness-2a4a4 --only firestore
npx firebase deploy --project powerfitness-2a4a4 --only hosting
```

Em uma instalação vendida, utilize o projeto Firebase do comprador e substitua o ID, a configuração web e a chave pública do App Check. Nunca coloque chave privada de conta de serviço no repositório.

O primeiro administrador deve criar uma conta, verificar o e-mail e receber, no Console Firestore, o documento `admins/UID_EXATO` com `ativo: true`. O site não permite promover a própria conta.

## Documentos

- [DOCUMENTACAO.md](DOCUMENTACAO.md): telas, operações, dados e comportamento.
- [SECURITY.md](SECURITY.md): controles técnicos e operação de segurança.
- [REVISAO_2_5.md](REVISAO_2_5.md): evidências e roteiro de aceitação.
- [ENTREGA.md](ENTREGA.md): implantação, transferência ao comprador e responsabilidades.
- [TESTAR.md](TESTAR.md): demonstração completa local, contas fictícias e roteiro no VS Code.
- [TESTE_COLEGAS.md](TESTE_COLEGAS.md): como liberar o link e registrar a avaliação no domínio publicado.

## Escopo de venda

Entrega de um sistema para uma academia, com personalização, implantação, fonte e documentação conforme o contrato. Não inclui pagamentos online, cobrança de mensalidades, controle contábil, catraca, prescrição de treino, notificações automáticas nem várias academias no mesmo banco. O suporte mensal é um serviço separado; a ausência desse pacote não elimina obrigações de correção e garantia aplicáveis.

A presença refere-se à aula agendada, não a controle de entrada por catraca. A solicitação não garante vaga até a confirmação. A versão precisa passar pela aceitação no projeto Firebase de destino antes da entrega comercial; testes locais não certificam conformidade jurídica nem ausência absoluta de falhas.
