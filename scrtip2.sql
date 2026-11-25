-- Execute after script.sql to add group invitation codes to an existing database.
BEGIN;

CREATE TABLE IF NOT EXISTS grupos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(500),
    lider_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grupo_membros (
    id SERIAL PRIMARY KEY,
    grupo_id INTEGER NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (grupo_id, usuario_id)
);

ALTER TABLE grupos
ADD COLUMN IF NOT EXISTS codigo VARCHAR(12);

UPDATE grupos
SET codigo = UPPER(SUBSTRING(MD5(random()::text || clock_timestamp()::text || id::text), 1, 12))
WHERE codigo IS NULL OR codigo = '';

ALTER TABLE grupos
ALTER COLUMN codigo SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_grupos_codigo
ON grupos(codigo);

ALTER TABLE tarefas
ADD COLUMN IF NOT EXISTS grupo_id INTEGER REFERENCES grupos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tarefas_grupo
ON tarefas(grupo_id);

INSERT INTO grupo_membros (grupo_id, usuario_id)
SELECT id, lider_id
FROM grupos
ON CONFLICT (grupo_id, usuario_id) DO NOTHING;

COMMIT;
