# Apresentação gratuita do Power Fitness

A decisão atual é manter o Firebase Spark e apresentar o projeto. A vitrine estática preserva o início do site, as fotos, os três planos ilustrativos, a equipe, o quadro compacto, IMC e simulador. Também mostra capturas dos painéis com dados fictícios. Não recebe cadastros, mensagens ou agendamentos; não se conecta ao banco.

## Gerar e publicar uma prévia

No terminal do VS Code, dentro da pasta do projeto, use no Windows:

```powershell
git pull --ff-only origin main
npm.cmd run build:apresentacao
npx.cmd --package=firebase-tools@15.32.1 firebase hosting:channel:deploy apresentacao --config firebase.apresentacao.json --project powerfitness-2a4a4 --expires 7d
```

O comando usa somente Hosting e cria/atualiza um canal temporário chamado `apresentacao`. Não publica Functions nem altera regras, contas ou dados. O site principal permanece na versão já publicada. O CLI deve estar conectado à conta autorizada no projeto. Se necessário, execute `npx.cmd --package=firebase-tools@15.32.1 firebase login` e siga a autenticação no navegador. Não envie senhas ou códigos pelo chat.

O build exige Node.js 20 ou superior e não precisa de Java nem de `npm ci`. A publicação exige acesso à internet e ao Firebase CLI. No Linux/Cloud Shell, use `npm` e `npx` em vez de `npm.cmd` e `npx.cmd`.

Depois da publicação, abra o endereço HTTPS informado pelo CLI. Confirme planos, equipe, sete dias de funcionamento, cálculos e as três imagens. Esse endereço, já testado no celular, pode ser usado no QR code; não use `localhost`. O canal expira após sete dias; publique novamente para renovar. Recursos gratuitos continuam sujeitos às cotas do Firebase.

## Mostrar os perfis completos no computador

Siga [TESTAR.md](TESTAR.md). Esse modo usa Firebase Emulator Suite, Node.js 22, Java 21 e contas fictícias, sem plano Blaze. O administrador, professor e aluno têm telas e permissões distintas. As capturas da vitrine não substituem esses testes.

## Antes de vender para operação real

Siga [ENTREGA.md](ENTREGA.md) e faça a aceitação em produção. A arquitetura completa atual usa Cloud Functions, cuja publicação exige Blaze. O titular deve decidir isso posteriormente, revisar custos e privacidade, preencher dados reais da academia e testar acessos e agendamentos. O build estático não é a implantação comercial completa.

As imagens em `assets/apresentacao/` são capturas da interface com respostas simuladas e identidades fictícias; não contêm dados de alunos reais. Se o visual dos painéis mudar, atualize as capturas e confira novamente a apresentação.
