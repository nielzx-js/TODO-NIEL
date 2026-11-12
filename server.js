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
    res.render('register')
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

    if (senha !== confirmarSenha) {
        return res.send(`
            <script>
            alert("as senhas não coincidem")
            window.location.href='register'
            </script>
            `)
    }
    if(senha.length<5){
        return res.send(`
            <script>
            alert("insira uma senha de pelo menos 5 digitos")
            window.location.href='register'
            </script>
            `)
    }
    const query1=`
    SELECT * FROM usuarios 
    WHERE email=$1
    `
    const result1= await pool.query(query1,[email])
    if(result1.rowCount>0){
        return res.send(`
            <script>
            alert("Já existe uma conta cadastrada com esse email")
            window.location.href='register'
            </script>
            `)
    }
    else{
        const senhaHash=await bcrypt.hash(senha,10)
        const query2=`
        INSERT INTO usuarios(nome,email,senha)
        VALUES($1,$2,$3)
        RETURNING *
        `
        const result2= await pool.query(query2,[nome,email,senhaHash])
      
        if(result2.rowCount>0){
            const usuario = result2.rows[0]
             req.session.usuario = {
             id: usuario.id,
             nome: usuario.nome,
             email: usuario.email
        }
            return res.redirect('/inicio')
        }else{
            res.send(`
             <script>
            alert("Erro ao realizar cadastro.")
            window.location.href='inicio'
                <script>
            `)
        }

    }
});
// fim de registro e login
//INICIO DE inicio (INICIO.EJS)

app.get('/inicio',async (req,res)=>{

        if (!req.session.usuario) {
        return res.redirect('/')
    }

   const id = req.session.usuario.id
    const query= 'SELECT * FROM tarefas WHERE usuario_id = $1'
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
        ORDER BY prioridade ASC, data_limite ASC
    `
    const result = await pool.query(query,[id])

    res.render('tarefas',{tarefas:result.rows})
  
})
app.get('/edit/:id',async (req,res)=>{
    const id = req.params.id
    const query='SELECT * FROM tarefas WHERE id = $1 AND usuario_id = $2 '
    const result = await pool.query(query,[id, req.session.usuario.id]);
      if (result.rowCount === 0) {
        return res.redirect('/tarefas');
    }
     res.render('editar', { tarefa: result.rows[0] });
})



//EDIÇÃO E EXCLUSÃO DE TAREFAS
app.post("/editar/:id", async(req,res)=>{
    const {titulo,descricao} = req.body
    const id=req.params.id
    const query= `
    UPDATE tarefas
    SET titulo = $1, descricao = $2
    WHERE id = $3 AND usuario_id = $4
    `
    const result = await pool.query(query,[titulo,descricao,id,req.session.usuario.id])
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
    const id = req.params.id
    const query=`
    DELETE FROM tarefas WHERE id=$1
    `
    const result = await pool.query(query,[id])
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
        res.redirect('/')
    }
    res.render("calendario")
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
        AND data_limite IS NOT NULL
    `;

    const result = await pool.query(query, [id]);

    res.json(result.rows);
});


//configuração e feedback
app.get('/config',async(req,res)=>{
    if(!req.session.usuario){
        res.redirect('/')
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
        res.redirect('/')
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
   res.render('2verify') 
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




app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`)
})