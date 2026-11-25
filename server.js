const express = require('express');
const path = require('path');
const pool = require('./database');
const app = express();
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const session = require('express-session');
const { createHash, randomBytes } = require('crypto');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
require('dotenv').config()
const PORT=process.env.PORT
const { randomInt } = require('crypto');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_SENHA
    }
});
app.use(session({
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false
}))

app.get('/',(req,res)=>{
    res.render('index')
})
app.get('/register',(req,res)=>{
    res.render('register', { erro: null })
})





//LOGIN E REGISTRO
app.post('/login', async(req,res)=>{
    const {email,senha} = req.body;
    const query=`
    SELECT * FROM usuarios
    WHERE email = $1
    `
    const result = await pool.query(query,[email])

    if(result.rowCount>0){
      const usuario = result.rows[0];

        const senhaCerta = await bcrypt.compare(
            senha,
            usuario.senha
        );
        if(senhaCerta){
              req.session.usuario = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        }
        res.redirect('inicio')
    }
    else{
           res.send(`
            <script>
            alert("Email ou senha incorreto.")
            window.location.href='/'
            </script>
        `)  
    }
        }
    else{
        res.send(`
            <script>
            alert("Email ou senha incorreto.")
            window.location.href='/'
            </script>
        `) 
    }
})

app.post('/register', async (req, res) => {
    const { nome, email, senha, confirmarSenha } = req.body;

    if (!nome || !email || !senha || senha !== confirmarSenha || senha.length < 5) {
        return res.status(400).render('register', { erro: 'dados' });
    }

    const existente = await pool.query(
        'SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)',
        [email]
    );
    if (existente.rowCount > 0) {
        return res.status(400).render('register', { erro: 'email' });
    }

    const codigo = randomInt(100000, 1000000).toString();
    const senhaHash = await bcrypt.hash(senha, 10);

    try {
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Código de verificação do cadastro',
            text: `Seu código de verificação é: ${codigo}`
        });
    } catch (error) {
        console.error('Erro ao enviar código de cadastro:', error);
        return res.status(500).send('Não foi possível enviar o código de verificação.');
    }

    req.session.cadastroPendente = {
        nome,
        email,
        senhaHash,
        codigo,
        tentativas: 0,
        expiracao: Date.now() + 10 * 60 * 1000
    };
    return res.redirect('/register/verificar');
});

app.get('/register/verificar', (req, res) => {
    const cadastro = req.session.cadastroPendente;
    if (!cadastro || Date.now() > cadastro.expiracao) {
        delete req.session.cadastroPendente;
        return res.redirect('/register');
    }
    res.render('register-verify', { email: cadastro.email, erro: false });
});

app.post('/register/verificar', async (req, res) => {
    const cadastro = req.session.cadastroPendente;
    if (!cadastro || Date.now() > cadastro.expiracao) {
        delete req.session.cadastroPendente;
        return res.redirect('/register');
    }
    if (req.body.codigo !== cadastro.codigo) {
        cadastro.tentativas += 1;
        if (cadastro.tentativas >= 5) {
            delete req.session.cadastroPendente;
            return res.status(400).render('register', { erro: 'codigo' });
        }
        return res.status(400).render('register-verify', {
            email: cadastro.email,
            erro: true
        });
    }

    const existente = await pool.query(
        'SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)',
        [cadastro.email]
    );
    if (existente.rowCount > 0) {
        delete req.session.cadastroPendente;
        return res.status(400).render('register', { erro: 'email' });
    }

    const result = await pool.query(
        'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
        [cadastro.nome, cadastro.email, cadastro.senhaHash]
    );
    const usuario = result.rows[0];
    delete req.session.cadastroPendente;
    req.session.usuario = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
    };
    return res.redirect('/inicio');
});
// fim de registro e login
//INICIO DE inicio (INICIO.EJS)

app.get('/inicio',async (req,res)=>{

        if (!req.session.usuario) {
        return res.redirect('/')
    }

   const id = req.session.usuario.id
    const query= 'SELECT * FROM tarefas WHERE usuario_id = $1 AND grupo_id IS NULL'
    const result = await pool.query(query,[id])

    res.render('inicio',{tarefas:result.rows})
})


app.get('/cadastrar',(req,res)=>{
    res.render('cadastrar')
})

app.post('/cadastrar', async(req,res)=>{
        if (!req.session.usuario) {
        return res.redirect('/')
    }
    const {titulo,descricao,data_limite} = req.body
    const id = req.session.usuario.id
      const data = data_limite || null;
    const query= `
    INSERT INTO tarefas(titulo,descricao,usuario_id,data_limite)
    VALUES($1,$2,$3,$4)
    `
  
    const result= await pool.query(query,[titulo,descricao,id,data])
    if(result.rowCount>0){
        res.send(`
            <script>
             alert("tarefa cadastrada!")
             window.location.href='/cadastrar'
            </script>
            `)
    }
})



app.get('/tarefas',async (req,res)=>{
       if (!req.session.usuario) {
        return res.redirect('/')
    }
    
    const id = req.session.usuario.id
    const query= `
     SELECT *,
            CASE
                WHEN status = 'concluida' THEN 5
                WHEN data_limite < CURRENT_DATE THEN 1
                WHEN data_limite = CURRENT_DATE THEN 2
                WHEN data_limite <= CURRENT_DATE + 3 THEN 3
                ELSE 4
            END AS prioridade
        FROM tarefas
        WHERE usuario_id = $1
        AND grupo_id IS NULL
        ORDER BY prioridade ASC, data_limite ASC
    `
    const result = await pool.query(query,[id])

    res.render('tarefas',{tarefas:result.rows})
  
})
app.get('/edit/:id',async (req,res)=>{
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    const id = req.params.id
    const query=`SELECT *, TO_CHAR(data_limite, 'YYYY-MM-DD') AS data_limite_formatada
                 FROM tarefas
                 WHERE id = $1 AND usuario_id = $2 AND grupo_id IS NULL`
    const result = await pool.query(query,[id, req.session.usuario.id]);
      if (result.rowCount === 0) {
        return res.redirect('/tarefas');
    }
     res.render('editar', { tarefa: result.rows[0] });
})



//EDIÇÃO E EXCLUSÃO DE TAREFAS
app.post("/editar/:id", async(req,res)=>{
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    const {titulo,descricao,data_limite} = req.body
    const id=req.params.id
    const data = data_limite || null
    const query= `
    UPDATE tarefas
    SET titulo = $1, descricao = $2, data_limite = $3
    WHERE id = $4 AND usuario_id = $5 AND grupo_id IS NULL
    `
    const result = await pool.query(query,[titulo,descricao,data,id,req.session.usuario.id])
    if(result.rowCount>0){
        res.send(`
            <script>
            alert("Editado!")
            window.location.href='/tarefas'
            </script>
            `)
    }
})
app.post('/excluir/:id',async(req,res)=>{
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    const id = req.params.id
    const query=`
    DELETE FROM tarefas WHERE id=$1 AND usuario_id=$2 AND grupo_id IS NULL
    `
    const result = await pool.query(query,[id,req.session.usuario.id])
    if(result.rowCount>0){
        res.send(`
            <script>
            alert("Deletado com sucesso!")
            window.location.href='/tarefas'
            </script>
            `)
    }
})
//marcar como concluída
app.post("/concluir/:id", async (req,res)=>{
    try{
    const id_tarefa=req.params.id;
    const id_user = req.session.usuario.id

    const query=`
    UPDATE tarefas
    SET status='concluidas'
    WHERE usuario_id = $1
    AND
    id=$2
    AND grupo_id IS NULL
    `
    const result = await pool.query(query,[id_user,id_tarefa])
       
    if(result.rowCount>0){
        res.redirect('/inicio')
    }
    }catch(error){
        console.log("Erro:",error)
    }


})

//desmarcar
app.post("/desmarcar/:id", async (req,res)=>{
    try{
    const id_tarefa=req.params.id;
    const id_user = req.session.usuario.id

    const query=`
    UPDATE tarefas
    SET status='pendente'
    WHERE usuario_id = $1
    AND
    id=$2
    AND grupo_id IS NULL
    `
    const result = await pool.query(query,[id_user,id_tarefa])
       
    if(result.rowCount>0){
        res.redirect('/inicio')
    }
    }catch(error){
        console.log("Erro:",error)
    }


})



app.get('/calendario',(req,res)=>{
    if(!req.session.usuario){
        return res.redirect('/')
    }
    res.render("calendario", { grupo: null })
})

app.get('/api/tarefas-calendario', async (req, res) => {

    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const id = req.session.usuario.id;

    const query = `
        SELECT 
            id,
            titulo,
            descricao,
            TO_CHAR(data_limite, 'YYYY-MM-DD') AS data_limite,
            status
        FROM tarefas
        WHERE usuario_id = $1
        AND grupo_id IS NULL
        AND data_limite IS NOT NULL
    `;

    const result = await pool.query(query, [id]);

    res.json(result.rows);
});


//configuração e feedback
app.get('/config',async(req,res)=>{
    if(!req.session.usuario){
        return res.redirect('/')
    }
    const id=req.session.usuario.id
    const query=`SELECT * FROM usuarios where id =$1`
    const result=await pool.query(query,[id])
    res.render("config",{usuario:result.rows[0]})
})
app.post('/config',async(req,res)=>{
    const {nome} = req.body;
    const id=req.session.usuario.id
    const query=`
    UPDATE usuarios 
    SET nome=$1 WHERE id = $2
    `
    const result=await pool.query(query,[nome,id])
    if(result.rowCount>0){
        return res.send(`
            <script>
            alert("Usuário atualizado!")
            window.location.href='/config'
            </script>
            `)
    }
})


app.get('/feedback',async(req,res)=>{
    if(!req.session.usuario){
        res.redirect('/')
    }
    else{
        
            const id = req.session.usuario.id;
         const usuario = await pool.query(
            'SELECT * FROM usuarios WHERE id = $1',
            [id]
        );

        const feedbacks = await pool.query(`
            SELECT 
                feedbacks.*,
                usuarios.nome
            FROM feedbacks
            INNER JOIN usuarios
            ON feedbacks.usuario_id = usuarios.id
            ORDER BY feedbacks.data_criacao DESC
        `);

           res.render('feedbacks', {
            usuario: usuario.rows[0],
            feedbacks: feedbacks.rows
        });
    }
})

app.get('/addfeedback',(req,res)=>{
       if (!req.session.usuario) {
        return res.redirect('/');
    }
    res.render("addfeedback")
})
app.post('/addfeedback', async(req,res)=>{
    
   const { titulo, descricao } = req.body;
    const id = req.session.usuario.id;

    const query = `
        INSERT INTO feedbacks (usuario_id, titulo, descricao, data_criacao)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
`;

const result=await pool.query(query, [id, titulo, descricao]);
if(result.rowCount>0){
    const query2=`
    UPDATE usuarios
    SET feedback=TRUE
    WHERE ID=$1
    `
    const result2=await pool.query(query2,[id])
    res.send(`
        <script>
        alert("obrigado pelo seu feedback!")
        window.location.href='/feedback'
        </script>
        `)
}
})
app.get("/verfeedback",async(req,res)=>{
    if(!req.session.usuario){
        return res.redirect('/')
    }
    const id=req.session.usuario.id
    const query=`
        SELECT * FROM feedbacks
        WHERE usuario_id=$1
    `
    const result=await pool.query(query,[id])

   

    res.render('verfeedback',{feedback:result.rows[0]})
})
app.post("/editarFeed/:id",async(req,res)=>{
    const {titulo,descricao} = req.body;
    const id = req.params.id;
    const query=`
    UPDATE feedbacks
    SET
    titulo=$1,
    descricao=$2
    WHERE id = $3
    `
    const result=await pool.query(query,[titulo,descricao,id])
    if(result.rowCount>0){
        res.send(`
            <script>
                      alert("Atualizado com sucesso!")
            window.location.href='/feedback'
            </script>

  
            `)
    }
})
app.post('/deletar/:id',async(req,res)=>{
    const id = req.params.id;
    const query=`
    DELETE FROM feedbacks 
    WHERE id=$1
    `
    const result=await pool.query(query,[id])
    if(result.rowCount>0){
        const userId=req.session.usuario.id
        const query2=`
        UPDATE usuarios
        SET feedback=FALSE
        where id=$1
        `
        await pool.query(query2,[userId])
        res.send(`
            <script>
            alert("Feedback deletado!")
            window.location.href='/feedback'
            </script>
            `)
    }
})


//VERIFICAÇÃO DE DUAS ETAPAS REGISTRO
app.get('/2step',(req,res)=>{
    res.render('2step')
})
app.post('/2step/enviar',async (req,res)=>{
    const {email}=req.body
    const query=`
    SELECT * FROM usuarios WHERE email=$1 
    `
    const result=await pool.query(query,[email])
    if(result.rowCount>0){
         const codigo= randomInt(100000, 1000000).toString();
        req.session.codigo={
        valor: codigo,
        email: email,
        expiracao: Date.now() + 5 * 60 * 1000
    }
   await transporter.sendMail({
        from:process.env.EMAIL,
      to:email,
       subject:"Código de verificação",
       text:`seu código de verificação é: ${codigo}`
  })
    res.redirect('/2verify')
    }
    else{
        res.send(`
            <script>
            alert("Email não encontrado")
            window.location.href='/2step'
            </script>
            `)
    }
 })
app.get('/password',(req,res)=>{
    if (!req.session.podeAlterarSenha || !req.session.codigo) {
        return res.redirect('/2step');
    }
    res.render("password")
})
app.get("/2verify",(req,res)=>{
   if (!req.session.codigo) {
       return res.redirect('/2step');
   }
   res.render('2verify', { email: req.session.codigo.email });
})
app.post('/enviar/2verify',async(req,res)=>{
    const {codigo}=req.body
    const verificacao = req.session.codigo
    if(!verificacao){
        return res.send(`
            <script>
            alert("Solicite um novo código")
            window.location.href='/2step'
            </script>
            `)
    }
      if (Date.now() > verificacao.expiracao) {
        delete req.session.codigo;
        return res.send(`
              <script>
            alert("Código expirado, solicite um novo código")
            window.location.href='/2step'
            </script>
            `)
    }
      if (codigo !== verificacao.valor) {
            return res.send(`
              <script>
            alert("Código incorreto")
            window.location.href='/2verify'
            </script>
            `)
    }
    if(codigo===verificacao.valor){
        req.session.podeAlterarSenha = true;
        return res.redirect('/password')
    }
})

app.post('/senha', async (req, res) => {
    try {
        const { senha1, senha2 } = req.body;
        if (!req.session.podeAlterarSenha || !req.session.codigo) {
            return res.redirect('/2step');
        }
        if (senha1.length < 5) {
            return res.send(`
                <script>
                alert("insira uma senha de pelo menos 5 digitos")
                window.location.href='/password'
                </script>
            `);
        }
        if (senha1 !== senha2) {
            return res.send(`
                <script>
                alert("As senhas não são iguais!")
                window.location.href='/password'
                </script>
            `);
        }
        const email = req.session.codigo.email;

        const senhaHash = await bcrypt.hash(senha1, 10);

        const query = `
            UPDATE usuarios
            SET senha = $1
            WHERE email = $2
        `;

        await pool.query(query, [senhaHash, email]);
        delete req.session.codigo;
        delete req.session.podeAlterarSenha;

        res.redirect('/');

    } catch (error) {
        console.error(error);
        res.send(`
            <script>
            alert("Erro ao atualizar senha")
            window.location.href='/password'
            </script>
            `);
    }   
});

async function buscarGrupoDoMembro(grupoId, usuarioId) {
    const result = await pool.query(`
        SELECT grupos.*
        FROM grupos
        INNER JOIN grupo_membros ON grupo_membros.grupo_id = grupos.id
        WHERE grupos.id = $1 AND grupo_membros.usuario_id = $2
    `, [grupoId, usuarioId]);
    return result.rows[0];
}

app.get('/grupos', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const result = await pool.query(`
        SELECT grupos.*, COUNT(membros.usuario_id)::int AS total_membros
        FROM grupos
        INNER JOIN grupo_membros AS participacao
            ON participacao.grupo_id = grupos.id
        LEFT JOIN grupo_membros AS membros
            ON membros.grupo_id = grupos.id
        WHERE participacao.usuario_id = $1
        GROUP BY grupos.id
        ORDER BY grupos.nome ASC
    `, [req.session.usuario.id]);

    res.render('grupos', {
        grupos: result.rows,
        usuarioId: req.session.usuario.id,
        mensagem: req.query.mensagem
    });
});

app.post('/grupos/criar', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const nome = (req.body.nome || '').trim();
    const descricao = (req.body.descricao || '').trim();
    if (!nome) {
        return res.redirect('/grupos');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const codigo = randomBytes(6).toString('hex').toUpperCase();
        const result = await client.query(`
            INSERT INTO grupos (nome, descricao, lider_id, codigo)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [nome, descricao || null, req.session.usuario.id, codigo]);
        const grupoId = result.rows[0].id;
        await client.query(
            'INSERT INTO grupo_membros (grupo_id, usuario_id) VALUES ($1, $2)',
            [grupoId, req.session.usuario.id]
        );
        await client.query('COMMIT');
        return res.redirect(`/grupos/${grupoId}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar grupo:', error);
        return res.status(500).send('Não foi possível criar o grupo.');
    } finally {
        client.release();
    }
});

app.post('/grupos/entrar', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const codigo = (req.body.codigo_grupo || '').trim().toUpperCase();
    const grupo = await pool.query(
        'SELECT id FROM grupos WHERE codigo = $1',
        [codigo]
    );
    if (grupo.rowCount === 0) {
        return res.redirect('/grupos?mensagem=codigo-invalido');
    }

    const membership = await pool.query(`
        INSERT INTO grupo_membros (grupo_id, usuario_id)
        VALUES ($1, $2)
        ON CONFLICT (grupo_id, usuario_id) DO NOTHING
        RETURNING grupo_id
    `, [grupo.rows[0].id, req.session.usuario.id]);
    if (membership.rowCount === 0) {
        return res.redirect('/grupos?mensagem=ja-membro');
    }
    return res.redirect('/grupos?mensagem=entrou');
});

app.get('/grupos/:grupoId', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const usuarioId = req.session.usuario.id;
    const grupo = await buscarGrupoDoMembro(req.params.grupoId, usuarioId);
    if (!grupo) {
        return res.status(404).send('Grupo não encontrado.');
    }

    const [membros, tarefas] = await Promise.all([
        pool.query(`
            SELECT usuarios.id AS usuario_id, usuarios.nome
            FROM grupo_membros
            INNER JOIN usuarios ON usuarios.id = grupo_membros.usuario_id
            WHERE grupo_membros.grupo_id = $1
            ORDER BY usuarios.nome
        `, [grupo.id]),
        pool.query(`
            SELECT tarefas.*,
                   usuarios.nome AS nome_criador,
                   TO_CHAR(tarefas.data_limite, 'DD/MM/YYYY') AS data_limite_formatada
            FROM tarefas
            INNER JOIN usuarios ON usuarios.id = tarefas.usuario_id
            WHERE tarefas.grupo_id = $1
            ORDER BY tarefas.data_limite NULLS LAST, tarefas.id DESC
        `, [grupo.id])
    ]);

    res.render('grupo', {
        grupo,
        membros: membros.rows,
        tarefas: tarefas.rows,
        isAdmin: grupo.lider_id === usuarioId
    });
});

app.post('/grupos/:grupoId/membros/:usuarioId/remover', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const grupo = await pool.query(
        'SELECT lider_id FROM grupos WHERE id = $1',
        [req.params.grupoId]
    );
    if (grupo.rowCount === 0) {
        return res.status(404).send('Grupo não encontrado.');
    }
    if (grupo.rows[0].lider_id !== req.session.usuario.id) {
        return res.status(403).send('Somente o administrador do grupo pode remover membros.');
    }
    if (Number(req.params.usuarioId) === grupo.rows[0].lider_id) {
        return res.status(400).send('O administrador não pode ser removido do grupo.');
    }

    await pool.query(
        'DELETE FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2',
        [req.params.grupoId, req.params.usuarioId]
    );
    return res.redirect(`/grupos/${req.params.grupoId}`);
});

app.post('/grupos/:grupoId/tarefas', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const grupo = await buscarGrupoDoMembro(req.params.grupoId, req.session.usuario.id);
    if (!grupo) {
        return res.status(404).send('Grupo não encontrado.');
    }

    const titulo = (req.body.titulo || '').trim();
    if (!titulo) {
        return res.redirect(`/grupos/${grupo.id}`);
    }
    await pool.query(`
        INSERT INTO tarefas (titulo, descricao, usuario_id, data_limite, grupo_id)
        VALUES ($1, $2, $3, $4, $5)
    `, [
        titulo,
        (req.body.descricao || '').trim() || null,
        req.session.usuario.id,
        req.body.data_limite || null,
        grupo.id
    ]);
    return res.redirect(`/grupos/${grupo.id}`);
});

app.get('/grupos/:grupoId/tarefas/:tarefaId/editar', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const grupo = await buscarGrupoDoMembro(req.params.grupoId, req.session.usuario.id);
    if (!grupo) {
        return res.status(404).send('Grupo não encontrado.');
    }
    const tarefa = await pool.query(`
        SELECT *, TO_CHAR(data_limite, 'YYYY-MM-DD') AS data_limite_formatada
        FROM tarefas
        WHERE id = $1 AND grupo_id = $2
    `, [req.params.tarefaId, grupo.id]);
    if (tarefa.rowCount === 0) {
        return res.status(404).send('Tarefa não encontrada.');
    }
    return res.render('editar', {
        tarefa: tarefa.rows[0],
        grupoId: grupo.id
    });
});

app.post('/grupos/:grupoId/tarefas/:tarefaId/editar', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const grupo = await buscarGrupoDoMembro(req.params.grupoId, req.session.usuario.id);
    if (!grupo) {
        return res.status(404).send('Grupo não encontrado.');
    }
    await pool.query(`
        UPDATE tarefas
        SET titulo = $1, descricao = $2, data_limite = $3
        WHERE id = $4 AND grupo_id = $5
    `, [
        (req.body.titulo || '').trim(),
        (req.body.descricao || '').trim() || null,
        req.body.data_limite || null,
        req.params.tarefaId,
        grupo.id
    ]);
    return res.redirect(`/grupos/${grupo.id}`);
});

app.post('/grupos/:grupoId/tarefas/:tarefaId/excluir', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const grupo = await buscarGrupoDoMembro(req.params.grupoId, req.session.usuario.id);
    if (!grupo) {
        return res.status(404).send('Grupo não encontrado.');
    }
    await pool.query(
        'DELETE FROM tarefas WHERE id = $1 AND grupo_id = $2',
        [req.params.tarefaId, grupo.id]
    );
    return res.redirect(`/grupos/${grupo.id}`);
});

app.get('/grupos/:grupoId/calendario', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    const grupo = await buscarGrupoDoMembro(req.params.grupoId, req.session.usuario.id);
    if (!grupo) {
        return res.status(404).send('Grupo não encontrado.');
    }
    return res.render('calendario', { grupo });
});

app.get('/api/grupos/:grupoId/tarefas-calendario', async (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ erro: 'Autenticação necessária.' });
    }
    const grupo = await buscarGrupoDoMembro(req.params.grupoId, req.session.usuario.id);
    if (!grupo) {
        return res.status(404).json({ erro: 'Grupo não encontrado.' });
    }

    const result = await pool.query(`
        SELECT id, titulo, descricao,
               TO_CHAR(data_limite, 'YYYY-MM-DD') AS data_limite,
               status
        FROM tarefas
        WHERE grupo_id = $1 AND data_limite IS NOT NULL
        ORDER BY data_limite
    `, [grupo.id]);
    return res.json(result.rows);
});


app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`)
})