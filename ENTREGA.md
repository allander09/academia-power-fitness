# Implantação e entrega ao comprador

## Escopo

Uma academia por projeto Firebase. A entrega comercial compreende o código, a configuração acordada, as três áreas de usuário, publicação e documentação, após a aceitação. O comprador controla as contas e pode contratar outro profissional para manutenção. O contrato deve separar implantação, futuras mudanças e eventual suporte recorrente. Correções de defeitos e garantias aplicáveis não se confundem com novas funcionalidades. A entrega do código não define, sozinha, exclusividade ou cessão integral de direitos; registre isso no contrato.

## O que precisa existir antes da produção

1. Projeto Firebase pertencente ao comprador, conta de faturamento Blaze para Functions e responsáveis identificados. A ativação de faturamento é feita pelo titular da conta após revisar custos.
2. Firestore criado em região deliberadamente escolhida, Authentication por e-mail/senha e app web registrado.
3. Domínios autorizados no Authentication e reCAPTCHA/App Check, inclusive o domínio final.
4. Dados reais e autorizados: nome, logo, cores, planos, preços, equipe, fotos, contato e funcionamento.
5. Controlador, canal de privacidade, finalidades/bases legais e conservação revisados pela academia; fornecedores e transferências internacionais avaliados.
6. Rotina de backup, acesso, descarte e incidentes, com responsável no cliente.

Não é necessário contratar suporte mensal do desenvolvedor para comprar o sistema. A operação acima permanece necessária e pode ser feita pelo comprador ou outro responsável técnico.

## Publicar esta versão

No computador autorizado do responsável, a partir da raiz do repositório:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
npm ci
npm ci --prefix functions
npm run check
npm test
npm run test:integration
npx firebase login
```

Para a instalação original o projeto é `powerfitness-2a4a4`; para venda use o ID do projeto do comprador. Copie a configuração pública do app web para `js/firebase-config.js` e a chave pública reCAPTCHA para `js/firebase-services.js`. Atualize canonical, Open Graph, URL de demonstração e manifest para o domínio final. Não publique chave privada nem senha.

Antes de substituir a versão publicada, faça backup. A versão 2.5 modifica o contrato de gravação: agendamentos, presença e atividades passam pelo servidor. **Não publique apenas o HTML ou apenas as regras.** Em janela de implantação controlada, publique Functions primeiro, índices/regras depois e Hosting por último, e execute a aceitação imediatamente. As chamadas novas dependem das funções e as regras novas bloqueiam a interface antiga. Evite alterações de agenda durante a troca e comunique a janela ao responsável.

```bash
npx firebase deploy --project powerfitness-2a4a4 --only functions
npx firebase deploy --project powerfitness-2a4a4 --only firestore
npx firebase deploy --project powerfitness-2a4a4 --only hosting
```

O índice declarado de data/atividade deve estar pronto antes de testar confirmações. Confirme também a política TTL declarada para `exclusoes.expiraEm`: ela limpa o bloqueio técnico somente após a exclusão concluída e o prazo de segurança. Nas funções, App Check é obrigatório. Configure a chave e o registro do app antes do teste; não desligue a proteção para contornar falhas em produção.

## Contas e carga inicial

A página inicial usa `data-demonstracao-publica="true"` no elemento `body` para a apresentação acadêmica. Nesse modo, planos, equipe e funcionamento ilustrativos continuam visíveis quando o banco está vazio ou indisponível; as notas de exemplo aparecem nas próprias seções e a simulação identifica valores ilustrativos. Os cadastros publicados no Firestore substituem esses exemplos quando carregados. O seletor de agendamento recebe somente planos e atividades do banco, e os exemplos visuais não criam reservas nem contas.

Antes do uso comercial, altere para `data-demonstracao-publica="false"` em `html/index.html` e publique após cadastrar e conferir o conteúdo real. Nesse modo, os exemplos ficam ocultos desde o HTML/CSS e uma falha de leitura informa indisponibilidade. A orientação de privacidade acompanha os formulários de cadastro, contato e agendamento, sem ocupar o destaque inicial nem a tela de login.

1. Cadastre a conta do administrador pelo site e verifique seu e-mail.
2. Em Authentication copie o UID exato dessa conta.
3. No Firestore crie `admins/{UID}` e o campo booleano `ativo: true`.
4. Saia e entre novamente: o login deve abrir Administração.
5. No painel, preencha **Responsável e privacidade**, os horários de funcionamento, planos e equipe.
6. Professores criam contas e verificam e-mail; o administrador concede o acesso e vincula as atividades.
7. Crie contas fictícias para os testes. Não entregue contas de teste com privilégios em produção.

Revogar um administrador requer alterar `admins/{UID}` no Console. Para retirar o desenvolvedor, transfira a propriedade administrativa/IAM primeiro e confirme que o comprador mantém acesso. Use contas individuais e não compartilhe senha.

## Dados de versões anteriores

Antes de migrar, exporte uma cópia e verifique o procedimento em um projeto de teste. O script de migração usa Firebase Admin com credenciais locais do responsável (Application Default Credentials). Essa credencial não deve ficar no Git nem no Hosting; o login da CLI Firebase, isoladamente, não configura ADC.

```bash
node scripts/migrar-2-5.mjs --project ID_DO_PROJETO
node scripts/migrar-2-5.mjs --project ID_DO_PROJETO --apply
```

A primeira chamada apenas relata. O script preenche identificador aleatório da aula, presença inicial e vínculo de atividade quando o vínculo for único. Interrompe aplicação se existir atividade ausente/ambígua. Não move dados entre projetos, não migra contas Authentication e não resolve duplicidades antigas automaticamente. Resolva as pendências identificadas antes da publicação.

## Aceitação

Antes da publicação, o responsável pode testar os três perfis com `npm run demo`, seguindo [TESTAR.md](TESTAR.md). O modo local não usa dados reais nem requer conta de faturamento. Isso permite revisar a entrega enquanto o acesso ao projeto de destino é configurado.

Use REVISAO_2_5.md no domínio final. Registre data, versão/commit, responsável, dispositivo, navegador e resultado dos fluxos. Conferir Console, falhas de rede, regras reais, App Check e e-mail de verificação/recuperação é obrigatório. Os testes locais já realizados não substituem esse registro. O comprador deve receber acesso e reproduzir o login administrativo antes do aceite.

Para uma avaliação pública antes da venda, siga [TESTE_COLEGAS.md](TESTE_COLEGAS.md). O link de Hosting já existente não comprova que esta atualização foi publicada.

## Rotina de privacidade e recuperação

- Periodicamente, revisar agendamentos encerrados, contatos respondidos e auditoria com os prazos configurados. Excluir apenas quando não existir finalidade ou obrigação de conservação e documentar a decisão. A aplicação não executa descarte por prazo automaticamente.
- Pedidos de exclusão: verificar identidade e conservação; se aprovado, remover também publicação/fotos de um profissional e registros externos antes de concluir o atendimento. O botão do painel remove dados relacionados no banco ativo e Authentication. A mensagem retorna um protocolo para o administrador registrar e comunicar ao titular.
- Se ocorrer falha no meio da exclusão, o pedido fica em processamento. Retomar pelo painel; a conta permanece desativada até a conclusão. Não marque conclusão por fora para ocultar a falha.
- Bloqueios `exclusoes/{UID}` recebem `expiraEm` somente após a exclusão completa, com prazo mínimo de 24 horas. O TTL declarado os remove de forma assíncrona após a expiração. Confira a política no projeto de destino; em pedido em processamento não existe expiração automática. [Referência do Firebase sobre TTL](https://firebase.google.com/docs/firestore/ttl).
- Tratar cópias, logs e backups conforme o prazo operacional aprovado. Não reintroduzir uma conta excluída ao restaurar uma cópia antiga. Testar restauração em projeto separado, incluindo os vínculos da agenda e as permissões.

## Pacote de entrega

- Repositório/commit aceito e instruções de clone.
- Domínio, propriedade/IAM do Firebase, acesso administrativo e faturamento do comprador.
- Personalização e origem/autorização de fotos e marca.
- Estes documentos e o registro dos testes no domínio final.
- Backup inicial e procedimento verificado de restauração.
- Registro de componentes/serviços, custos variáveis e pendências aceitas por escrito.

Pagamento online, cobrança recorrente, financeiro, fichas de treino, catraca, WhatsApp e múltiplas academias são novos escopos. Não anunciar esses módulos como incluídos.
