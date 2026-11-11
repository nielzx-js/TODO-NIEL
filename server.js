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
    const query= 'SELECT * FROM tarefas WHERE usuario_id = $1'
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


app.get('/calendario',(req,res)=>{
    res.render("calendario")
})


app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`)
})