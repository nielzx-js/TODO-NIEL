const bcrypt = require('bcrypt');

// 1. Defina a senha sempre como String (entre aspas)
const senha = '123'; 

async function teste(senha) {
    // O segundo parâmetro (10) é o custo (saltRounds)
    const senhaHash = await bcrypt.hash(senha, 10);
    return senhaHash;
}

// 2. Chame a função tratando a Promise com .then() ou uma IIFE
teste(senha)
    .then(hash => console.log('Senha criptografada:', hash))
    .catch(erro => console.error('Erro:', erro));
