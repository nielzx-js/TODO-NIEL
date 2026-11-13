
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200),
    email VARCHAR(200),
    senha VARCHAR(100),
    cargo VARCHAR(10) DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS tarefas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200),
    descricao VARCHAR(400),
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pendente',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_limite DATE
);

-- Garantir as colunas caso as tabelas já existam

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS cargo VARCHAR(10) DEFAULT 'user';

ALTER TABLE tarefas
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS data_limite DATE;

-- Remover cargo de tarefas, caso ainda exista

ALTER TABLE tarefas
DROP COLUMN IF EXISTS cargo;

-- Garantir as restrições de cargo e status

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'usuarios_cargo_check'
    ) THEN
        ALTER TABLE usuarios
        ADD CONSTRAINT usuarios_cargo_check
        CHECK (cargo IN ('admin', 'user'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tarefas_status_check'
    ) THEN
        ALTER TABLE tarefas
        ADD CONSTRAINT tarefas_status_check
        CHECK (status IN ('pendente', 'concluidas', 'atrasado'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200),
    email VARCHAR(200),
    senha VARCHAR(100),
    cargo VARCHAR(10) DEFAULT 'user',
    feedback BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tarefas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200),
    descricao VARCHAR(400),
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pendente',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_limite DATE
);

-- Garantir as colunas caso as tabelas já existam

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS cargo VARCHAR(10) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS feedback BOOLEAN DEFAULT FALSE;

ALTER TABLE tarefas
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS data_limite DATE;

-- Remover cargo de tarefas, caso ainda exista

ALTER TABLE tarefas
DROP COLUMN IF EXISTS cargo;

-- Garantir as restrições de cargo e status

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'usuarios_cargo_check'
    ) THEN
        ALTER TABLE usuarios
        ADD CONSTRAINT usuarios_cargo_check
        CHECK (cargo IN ('admin', 'user'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tarefas_status_check'
    ) THEN
        ALTER TABLE tarefas
        ADD CONSTRAINT tarefas_status_check
        CHECK (status IN ('pendente', 'concluidas', 'atrasado'));
    END IF;
END $$;
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao VARCHAR(1000) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- TABELA DE GRUPOS
-- =====================================

CREATE TABLE IF NOT EXISTS grupos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(500),
    lider_id INTEGER NOT NULL REFERENCES usuarios(id)
        ON DELETE CASCADE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================
-- MEMBROS DOS GRUPOS
-- =====================================

CREATE TABLE IF NOT EXISTS grupo_membros (
    id SERIAL PRIMARY KEY,
    grupo_id INTEGER NOT NULL REFERENCES grupos(id)
        ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id)
        ON DELETE CASCADE,
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (grupo_id, usuario_id)
);


-- =====================================
-- ADICIONAR GRUPO ÀS TAREFAS
-- =====================================

ALTER TABLE tarefas
ADD COLUMN IF NOT EXISTS grupo_id INTEGER
REFERENCES grupos(id) ON DELETE CASCADE;


-- =====================================
-- ÍNDICES PARA CONSULTAS
-- =====================================

CREATE INDEX IF NOT EXISTS idx_grupo_membros_usuario
ON grupo_membros(usuario_id);

CREATE INDEX IF NOT EXISTS idx_grupo_membros_grupo
ON grupo_membros(grupo_id);

CREATE INDEX IF NOT EXISTS idx_tarefas_grupo
ON tarefas(grupo_id);
