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
        res.send(`
            <script>
            alert("Login feito com sucesso!")
            window.location.href='inicio'
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















app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`)
})