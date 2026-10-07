# Correções de autenticação, App Check e agendamento

## App Check

O frontend não gera mais automaticamente um token de debug. Em produção, o Firebase App Check usa reCAPTCHA Enterprise e a proteção da callable Function continua obrigatória.

Para desenvolvimento local com backend real, o domínio/porta usados precisam estar autorizados no reCAPTCHA Enterprise/App Check do projeto Firebase. Para desenvolvimento totalmente local, use o servidor na porta 5000 para ativar os emuladores.

## CORS

As callable Functions aceitam apenas:
- localhost/127.0.0.1 em qualquer porta de desenvolvimento;
- powerfitness-2a4a4.web.app;
- powerfitness-2a4a4.firebaseapp.com.

A autenticação e o App Check continuam sendo obrigatórios; CORS não é usado como mecanismo de autorização.

## Aula experimental

O agendamento possui os tipos "normal" e "experimental". A experimental exige CPF válido no backend.

O backend:
1. normaliza e valida o CPF;
2. nunca armazena o CPF puro;
3. cria um hash SHA-256 como chave de controle;
4. bloqueia uma segunda aula experimental para o mesmo CPF, independentemente do frontend;
5. grava o tipo do agendamento.

## E-mail de confirmação

A Function grava uma mensagem na coleção `mail` usando o formato compatível com a Firebase Extension "Trigger Email". Para envio efetivo, a extensão precisa estar instalada e configurada com um provedor SMTP no projeto Firebase. Sem essa configuração, o agendamento continua sendo salvo, mas nenhum e-mail externo é enviado.

## Sessão

O redirecionamento automático de uma conta já autenticada no login é comportamento normal do Firebase Auth quando a persistência local está ativa. O sistema continua exigindo senha no primeiro login e oferece "Sair"; não foi adicionada uma falsa correção que quebrasse a persistência normal.

## Administrador

O administrador continua protegido por `admins/{uid}` com `ativo == true` e agora pode abrir o mesmo fluxo de agendamento. No backend, uma conta administrativa pode agendar sem precisar ter um documento de aluno em `usuarios`; a identidade usada no agendamento vem do perfil, quando existir, ou do nome/e-mail da conta.

## Validação

Antes da publicação, execute:
`npm test`
`npm run check`
`npm run test:integration`
