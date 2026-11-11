# TodoNiel

![Status: em desenvolvimento](https://img.shields.io/badge/status-em%20desenvolvimento-orange)

## Visão geral

O TodoNiel é uma aplicação web de organização pessoal inspirada no Todoist. O projeto atual já inclui autenticação de usuários, cadastro de tarefas, dashboard inicial e calendário com datas limite.

## Funcionalidades implementadas

- Login e registro de usuários
- Sessões autenticadas com `express-session`
- Hash de senha com `bcrypt`
- Cadastro, listagem, edição e exclusão de tarefas
- Marcar e desmarcar tarefas como concluídas
- Dashboard com tarefas próximas do prazo
- Calendário com tarefas por data limite
- Layout responsivo e suporte PWA com manifesto e ícones

## Funcionalidades em planejamento

- Recuperação de senha por código
- Grupos e tarefas compartilhadas
- Lembretes por e-mail
- Feedback com avaliação por estrelas

## Stack tecnológica

- Node.js
- Express
- EJS
- PostgreSQL
- `pg`
- `express-session`
- `bcrypt`
- `dotenv`
- `nodemailer`
- `nodemon`

## Requisitos

- Node.js 18+
- PostgreSQL
- npm

## Como executar localmente

1. Clone o repositório.
2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto com as variáveis abaixo:

```env
PORT=3000
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"
SESSION_SECRET=sua_chave_secreta
```

> O projeto também traz o arquivo `.env.exemple` como referência inicial.

4. Crie o banco PostgreSQL e execute o script `script.sql` para preparar as tabelas `usuarios` e `tarefas`.

5. Inicie a aplicação:

```bash
npm start
```

Ou em modo de desenvolvimento:

```bash
npm run dev
```

## Estrutura do projeto

```text
sistema_TODOIST/
├── public/
│   ├── css/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── offline.html
├── views/
│   ├── partials/
│   ├── cadastrar.ejs
│   ├── calendario.ejs
│   ├── editar.ejs
│   ├── index.ejs
│   ├── inicio.ejs
│   ├── register.ejs
│   └── tarefas.ejs
├── docs/
│   └── desigin/
│       ├── jpgs/
│       └── todoist.pdf
├── .env.exemple
├── database.js
├── package.json
├── script.sql
├── server.js
├── README.md
└── package-lock.json
```

## Observações

- A aplicação usa PostgreSQL e conecta por `DATABASE_URL` no arquivo `database.js`.
- O arquivo `script.sql` contém a estrutura inicial das tabelas e validações de status.
- O README foi ajustado para refletir o estado atual do projeto e não apenas o protótipo visual.

## Licença

A licença ainda não foi definida.
