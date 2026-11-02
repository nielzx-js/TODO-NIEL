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

app.get('/',(req,res)=>{
    res.render('index')
})
app.get('/register',(req,res)=>{
    res.render('register')
})


app.get('/dashboard',(req,res)=>{
    res.render('inicio')
})





//LOGIN E REGISTRO
app.post('/login', async(req,res)=>{
    const {email,senha} = req.body;
    const query=`
    SELECT * FROM usuarios
    WHERE email = $1
    AND 
    senha = $2
    `
    const result = await pool.query(query,[email,senha])
    if(result.rowCount>0){
        res.send(`
            <script>
            alert("Login feito com sucesso!")
            window.location.href='dashboard'
            </script>
            `)
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
    AND
    senha = $2
    `
    const result1= await pool.query(query1,[email,senha])
    if(result1.rowCount>0){
        return res.send(`
            <script>
            alert("Já existe uma conta cadastrada com esse email")
            window.location.href='register'
            </script>
            `)
    }
    else{
        const query2=`
        INSERT INTO usuarios(nome,email,senha)
        VALUES($1,$2,$3)
        `
        const result2= await pool.query(query2,[nome,email,senha])
        if(result2.rowCount>0){
            res.send(`
            <script>
            alert("Cadastro feito com sucesso.")
            window.location.href='dashboard'
            <script>
            `)
        }else{
            res.send(`
             <script>
            alert("Erro ao realizar cadastro.")
            window.location.href='dashboard'
                <script>
            `)
        }

    }
});












app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`)
})