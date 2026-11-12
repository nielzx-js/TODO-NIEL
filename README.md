# TodoNiel

![Status: em desenvolvimento](https://img.shields.io/badge/status-em%20desenvolvimento-orange)

> **🚧 Projeto em desenvolvimento**
>
> Este repositório contém o protótipo do design e o código ainda está em construção. Tudo o que estiver marcado como **planejado** ainda não está pronto. A autenticação atual já usa sessão e hash de senha com `bcrypt`. Não use dados reais.

## Sobre o projeto

TodoNiel é um gerenciador de tarefas inspirado no Todoist, com foco em organização pessoal, autenticação e acompanhamento de tarefas. A aplicação já conta com login, registro, hash de senha, sessão, gestão de tarefas em cartões e visualização de tarefas com data de entrega no calendário; os recursos mais avançados do roadmap seguem planejados.

## Status do desenvolvimento

- [x] Design gráfico das telas (protótipo)
- [x] Login com sessão
- [x] Registro funcional com validação de senha
- [x] Exibição das tarefas do usuário em cartões com título, descrição e status
- [x] Cadastro de tarefas
- [x] Visualização e edição de tarefas com layout responsivo
- [x] Estilização visual seguindo a paleta do projeto
- [x] Exibição no calendário das tarefas com data de entrega
- [x] Status de prazo: atrasado, perto do prazo e no prazo
- [ ] Redefinição de senha com código numérico
- [ ] Grupos: criar, entrar por código, calendário do grupo e membros
- [ ] E-mails de lembrete de 4 a 1 dia antes do prazo
- [x] Feedback com estrelas
- [x] Hash de senhas com bcrypt

## Funcionalidades

**Implementadas:** protótipo gráfico das telas em `docs/desigin/jpgs/`; autenticação com sessão; registro de usuários com confirmação de senha; hash de senhas com `bcrypt`; listagem de tarefas do usuário em cartões; cadastro de tarefas com título, descrição e data de entrega; edição e exclusão de tarefas; calendário mensal com navegação e exibição das tarefas que têm data de entrega; visual responsivo da aplicação; e estilos visuais alinhados à paleta definida do projeto (`#0F1220`, `#1A1F33`, `#6C5CE7`, `#00B8D9`, `#2ECC71`, `#F5A623`, `#E5484D`).

**Planejadas:** status de prazo por proximidade, grupos com código e calendário compartilhado, redefinição de senha com código numérico, lembretes por e-mail e feedback com estrelas.

## Protótipo (design)

As imagens abaixo mostram o protótipo gráfico; elas não representam funcionalidades já implementadas.

### Acesso e conta

<table>
  <tr>
    <td>
      <img src="docs/desigin/jpgs/LOGIN.jpg" width="100%" alt="Tela de login">
      <p><strong>Login</strong> — e-mail e senha, link “Esqueci minha senha” e link para o registro.</p>
    </td>
    <td>
      <img src="docs/desigin/jpgs/REGISTRO.jpg" width="100%" alt="Tela de registro">
      <p><strong>Registro</strong> — e-mail, nome e senha.</p>
    </td>
  </tr>
  <tr>
    <td>
      <img src="docs/desigin/jpgs/SEUEMAIL.jpg" width="100%" alt="Redefinição de senha: informar e-mail">
      <p><strong>Redefinição de senha — passo 1</strong> — informar o e-mail.</p>
    </td>
    <td>
      <img src="docs/desigin/jpgs/CODIGO.jpg" width="100%" alt="Redefinição de senha: código de seis dígitos">
      <p><strong>Redefinição de senha — passo 2</strong> — informar o código numérico de 6 dígitos.</p>
    </td>
  </tr>
</table>

### Tarefas e calendário

<table>
  <tr>
    <td>
      <img src="docs/desigin/jpgs/INICIO.jpg" width="100%" alt="Tela inicial com atividades próximas da entrega">
      <p><strong>Início</strong> — atividades próximas da entrega, status por cor e botão “Concluído”.</p>
    </td>
    <td>
      <img src="docs/desigin/jpgs/ADD_TAREFA.jpg" width="100%" alt="Tela para adicionar tarefa">
      <p><strong>Adicionar tarefa</strong> — título, data de entrega e descrição opcional.</p>
    </td>
  </tr>
  <tr>
    <td>
      <img src="docs/desigin/jpgs/CALENDARIO.jpg" width="100%" alt="Calendário com tarefas coloridas por status">
      <p><strong>Calendário</strong> — tarefas coloridas de acordo com o status.</p>
    </td>
    <td></td>
  </tr>
</table>

### Grupos

<table>
  <tr>
    <td>
      <img src="docs/desigin/jpgs/GRUPOS.jpg" width="100%" alt="Tela com grupos e atalhos para criar ou entrar">
      <p><strong>Grupos</strong> — cards com opções para ver calendário e membros ou sair, além de atalhos para entrar ou criar grupo.</p>
    </td>
    <td>
      <img src="docs/desigin/jpgs/CRIAR_GRUPO.jpg" width="100%" alt="Tela para criar grupo">
      <p><strong>Criar grupo</strong> — nome e escolha de quem pode entrar: qualquer pessoa com o código ou pessoas permitidas.</p>
    </td>
  </tr>
  <tr>
    <td>
      <img src="docs/desigin/jpgs/CODIGO_GRUPO.jpg" width="100%" alt="Tela para entrar em um grupo pelo código">
      <p><strong>Entrar em grupo</strong> — informar o código do grupo.</p>
    </td>
    <td></td>
  </tr>
</table>

### Feedback e configurações

<table>
  <tr>
    <td>
      <img src="docs/desigin/jpgs/FEEDBACK.jpg" width="100%" alt="Lista de feedbacks com estrelas">
      <p><strong>Feedbacks</strong> — lista de avaliações com estrelas e opções de editar ou excluir os próprios feedbacks.</p>
    </td>
    <td>
      <img src="docs/desigin/jpgs/SEUFEEDBACK.jpg" width="100%" alt="Tela para deixar feedback">
      <p><strong>Deixar feedback</strong> — avaliação com estrelas e comentário opcional.</p>
    </td>
  </tr>
  <tr>
    <td>
      <img src="docs/desigin/jpgs/CONFIG.jpg" width="100%" alt="Tela de configurações da conta">
      <p><strong>Configurações</strong> — nome, e-mail e opção para alterar a senha.</p>
    </td>
    <td></td>
  </tr>
</table>

[Ver o PDF completo do design](docs/desigin/todoist.pdf).

## Paleta de cores

| Nome | Uso | Código |
|---|---|---|
| Fundo | Fundo principal | `#0F1220` |
| Superfície | Cards e áreas elevadas | `#1A1F33` |
| Borda | Contornos e divisórias | `#2B3250` |
| Primária | Ações e elementos principais | `#6C5CE7` |
| Secundária | Elementos de apoio | `#00B8D9` |
| Destaque | Destaques visuais | `#FF6B6B` |
| Texto | Texto principal | `#E8EAF6` |
| Texto secundário | Texto auxiliar | `#9AA3C7` |
| Sucesso | Estado de sucesso | `#2ECC71` |
| Alerta | Avisos | `#F5A623` |
| Erro | Erros | `#E5484D` |

## Tecnologias

A base do projeto já está configurada com dependências reais no `package.json` e o código usa PostgreSQL, Express, EJS e autenticação por sessão.

Implementadas/confirmadas:

- Express
- EJS
- PostgreSQL (`pg`)
- express-session
- bcrypt
- dotenv
- nodemailer
- nodemon

Planejadas:

- FullCalendar
- node-cron
- lembretes automatizados por e-mail

## Como rodar localmente

A aplicação já possui `package.json` com scripts de execução e a estrutura inicial de configuração, então os passos para rodar localmente são:

1. Clonar o repositório.
2. Instalar as dependências com `npm install`.
3. Criar um arquivo `.env` com as variáveis necessárias, conforme o exemplo em `.env.exemple` (ajustar o nome do arquivo para `.env` se for necessário).
4. Criar o banco PostgreSQL e executar o script `script.sql` para criar as tabelas `usuarios` e `tarefas`.
5. Iniciar o servidor com `npm start` ou `npm run dev`.

Exemplo mínimo de `.env`:

```env
PORT=3000
DATABASE_URL=******localhost:5432/nome_do_banco
SESSION_SECRET=sua_chave_secreta
```

## Estrutura de pastas

Estrutura resumida encontrada:

```text
sistema_TODOIST/
├── public/
│   └── css/
│       └── style.css
├── views/
│   ├── index.ejs
│   ├── register.ejs
│   ├── cadastrar.ejs
│   ├── inicio.ejs
│   └── partials/
│       └── menu.ejs
├── docs/
│   └── desigin/
│       ├── jpgs/
│       │   ├── ADD_TAREFA.jpg
│       │   ├── CALENDARIO.jpg
│       │   ├── CODIGO.jpg
│       │   ├── CODIGO_GRUPO.jpg
│       │   ├── CONFIG.jpg
│       │   ├── CRIAR_GRUPO.jpg
│       │   ├── FEEDBACK.jpg
│       │   ├── GRUPOS.jpg
│       │   ├── INICIO.jpg
│       │   ├── LOGIN.jpg
│       │   ├── REGISTRO.jpg
│       │   ├── SEUEMAIL.jpg
│       │   └── SEUFEEDBACK.jpg
│       └── todoist.pdf
├── .env.exemple
├── database.js
├── package.json
├── script.sql
├── server.js
├── README.md
└── package-lock.json
```

## Próximos passos

1. Status de prazo
2. Grupos
3. E-mails de lembrete
4. Feedback e redefinição de senha

## Autor

Nyel — [GitHub](https://github.com/nielzx-js)

## Licença

A definir.
