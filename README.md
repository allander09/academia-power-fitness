# Power Fitness

Site responsivo de uma academia fictícia, desenvolvido com HTML, CSS, JavaScript e Firebase.

## Funcionalidades

- apresentação de serviços, planos, equipe e horários;
- calculadora de IMC;
- cálculo de mensalidade;
- solicitação de aula experimental;
- formulário de contato com validação;
- cadastro de usuários com Firebase Authentication e Firestore;
- menu responsivo e modal acessível.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Firebase Authentication
- Cloud Firestore

## Executar localmente

Como o cadastro usa módulos JavaScript, abra o projeto por um servidor local. No VS Code, você pode usar a extensão Live Server e abrir `index.html`.

## Estrutura

- `index.html`: entrada para hospedagem;
- `html/`: páginas;
- `css/`: estilos;
- `js/`: comportamentos e integração com Firebase;
- `firestore.rules`: regras recomendadas do banco.

## Firebase

A configuração web do Firebase fica em `js/firebase-config.js`. As chaves de aplicativos web identificam o projeto, mas a proteção dos dados depende das regras do Firestore.

Antes de usar o sistema em produção:

1. revise e publique `firestore.rules` no Firebase;
2. confirme que Authentication por e-mail e senha está ativado;
3. teste leitura e gravação com usuários diferentes;
4. substitua os dados fictícios de contato e funcionamento.

## Publicação

O projeto pode ser publicado pelo GitHub Pages usando a branch principal e a pasta raiz.

## Observação

Este é um projeto educacional. O cálculo de IMC é informativo e não substitui avaliação de um profissional de saúde.
