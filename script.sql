create table usuarios(
  id SERIAL PRIMARY KEY,
  nome varchar(200),
  email varchar(200),
  senha varchar(100)
  
)

CREATE TABLE tarefas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200),
    descricao VARCHAR(400),
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE
);

ALTER TABLE tarefas
ADD COLUMN cargo VARCHAR(10) DEFAULT 'user'
CHECK (cargo IN ('admin', 'user'));