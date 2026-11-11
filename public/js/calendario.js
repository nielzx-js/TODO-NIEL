
const mesAno = document.getElementById('mesAno');
const dias = document.getElementById('dias');

const hoje = new Date();

let mesAtual = hoje.getMonth();
let anoAtual = hoje.getFullYear();

let diaSelecionado = hoje.getDate();

let tarefas=[]
async function buscarTarefas(){
    const response=await fetch('/api/tarefas-calendario')
    tarefas = await response.json()
    gerarCalendario()
}



function gerarCalendario() {
     dias.innerHTML = '';
    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();

    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate();

    const nomeMes = new Date(anoAtual, mesAtual).toLocaleDateString('pt-BR', {
        month: 'long'
    });

    mesAno.textContent = `${nomeMes} ${anoAtual}`;

    for (let i = 0; i < primeiroDia; i++) {

        const vazio = document.createElement('div');

        vazio.classList.add('dia', 'vazio');

        dias.appendChild(vazio);
    }

    for (let dia = 1; dia <= ultimoDia; dia++) {

        const elemento = document.createElement('div');

        elemento.classList.add('dia');

        elemento.textContent = dia;
        const dataAtual = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

const tarefasDoDia = tarefas.filter(tarefa => {
    return tarefa.data_limite === dataAtual;
});

tarefasDoDia.forEach(tarefa => {

    const item = document.createElement('div');

     item.classList.add('tarefa-calendario')

    item.textContent = tarefa.titulo;

    elemento.appendChild(item);

}); 
        if (
            dia === hoje.getDate() &&
            mesAtual === hoje.getMonth() &&
            anoAtual === hoje.getFullYear()
        ) {
            elemento.classList.add('hoje');
        }

        if (dia === diaSelecionado) {
            elemento.classList.add('selecionado');
        }

        elemento.addEventListener('click', () => {

            diaSelecionado = dia;

            gerarCalendario();

            console.log(
                `${dia}/${mesAtual + 1}/${anoAtual}`
            );

        });

        dias.appendChild(elemento);
    }
}

document.getElementById('anterior').addEventListener('click', () => {

    mesAtual--;

    if (mesAtual < 0) {
        mesAtual = 11;
        anoAtual--;
    }

    diaSelecionado = null;

    gerarCalendario();

});

document.getElementById('proximo').addEventListener('click', () => {

    mesAtual++;

    if (mesAtual > 11) {
        mesAtual = 0;
        anoAtual++;
    }

    diaSelecionado = null;

    gerarCalendario();

});
buscarTarefas();
