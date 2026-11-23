-- =====================================================================
-- LOGICFLOW | Plataforma Digital de Capacidade Ociosa para Facções
-- e Confecções do Agreste Pernambucano
-- Projeto Integrador SENAC - Engenharia de Requisitos / Banco de Dados
-- SGBD: PostgreSQL 13+ (compatível com Supabase)
-- Observação: se usar o Supabase Auth, troque o DEFAULT gen_random_uuid()
-- de usuario.id_usuario por REFERENCES auth.users(id).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. USUÁRIOS E PERFIS
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id_usuario          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    telefone            VARCHAR(20)  NOT NULL UNIQUE,            -- login por telefone (RF01)
    nome                VARCHAR(120) NOT NULL,
    tipo_perfil         VARCHAR(10)  NOT NULL,                   -- RF02
    status              VARCHAR(10)  NOT NULL DEFAULT 'ATIVO',
    cadastro_verificado BOOLEAN      NOT NULL DEFAULT FALSE,     -- selo de verificação
    consentimento_lgpd  BOOLEAN      NOT NULL DEFAULT FALSE,     -- RNF04
    data_consentimento  TIMESTAMPTZ,
    data_cadastro       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_usuario_tipo   CHECK (tipo_perfil IN ('CONFECCAO', 'FACCAO', 'ADMIN')),
    CONSTRAINT ck_usuario_status CHECK (status IN ('ATIVO', 'SUSPENSO', 'INATIVO')),
    CONSTRAINT ck_usuario_lgpd   CHECK (NOT consentimento_lgpd OR data_consentimento IS NOT NULL)
);

CREATE TABLE confeccao (
    id_usuario     UUID         PRIMARY KEY
                   REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    nome_fantasia  VARCHAR(120) NOT NULL,
    cnpj           CHAR(14)     UNIQUE,                          -- opcional
    cidade         VARCHAR(80)  NOT NULL,
    uf             CHAR(2)      NOT NULL DEFAULT 'PE',
    descricao      TEXT,
    whatsapp       VARCHAR(20)                                   -- RF14
);

CREATE TABLE faccao (
    id_usuario       UUID         PRIMARY KEY
                     REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    nome_fantasia    VARCHAR(120) NOT NULL,
    cnpj             CHAR(14)     UNIQUE,                        -- opcional (informalidade)
    cidade           VARCHAR(80)  NOT NULL,
    uf               CHAR(2)      NOT NULL DEFAULT 'PE',
    descricao        TEXT,
    whatsapp         VARCHAR(20),                                -- RF14
    disponivel_agora BOOLEAN      NOT NULL DEFAULT FALSE         -- sinalização de disponibilidade
);

-- ---------------------------------------------------------------------
-- 2. CATÁLOGO DE SERVIÇOS, CAPACIDADE E AGENDA
-- ---------------------------------------------------------------------
CREATE TABLE categoria_servico (
    id_categoria SMALLINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome         VARCHAR(60) NOT NULL UNIQUE,
    descricao    VARCHAR(255),
    ativa        BOOLEAN     NOT NULL DEFAULT TRUE               -- mantida pelo administrador
);

CREATE TABLE faccao_servico (                                    -- RF03 (N:N)
    id_faccao        UUID        NOT NULL
                     REFERENCES faccao (id_usuario) ON DELETE CASCADE,
    id_categoria     SMALLINT    NOT NULL
                     REFERENCES categoria_servico (id_categoria),
    preco_referencia NUMERIC(12,2),
    observacao       VARCHAR(255),
    PRIMARY KEY (id_faccao, id_categoria),
    CONSTRAINT ck_fs_preco CHECK (preco_referencia IS NULL OR preco_referencia >= 0)
);

CREATE TABLE capacidade_semanal (                                -- RF04
    id_capacidade    BIGINT  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_faccao        UUID    NOT NULL
                     REFERENCES faccao (id_usuario) ON DELETE CASCADE,
    semana_inicio    DATE    NOT NULL,                           -- segunda-feira da semana
    capacidade_pecas INTEGER NOT NULL,
    pecas_ocupadas   INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_capacidade_semana UNIQUE (id_faccao, semana_inicio),
    CONSTRAINT ck_cap_valores CHECK (capacidade_pecas >= 0
                                     AND pecas_ocupadas >= 0
                                     AND pecas_ocupadas <= capacidade_pecas)
);

CREATE TABLE periodo_agenda (                                    -- RF04: livres/ocupados
    id_periodo  BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_faccao   UUID        NOT NULL
                REFERENCES faccao (id_usuario) ON DELETE CASCADE,
    data_inicio DATE        NOT NULL,
    data_fim    DATE        NOT NULL,
    situacao    VARCHAR(7)  NOT NULL,
    observacao  VARCHAR(255),
    CONSTRAINT ck_periodo_situacao CHECK (situacao IN ('LIVRE', 'OCUPADO')),
    CONSTRAINT ck_periodo_datas    CHECK (data_fim >= data_inicio)
);

-- ---------------------------------------------------------------------
-- 3. DEMANDAS, FOTOS, PROPOSTAS E ACORDOS
-- ---------------------------------------------------------------------
CREATE TABLE demanda (                                           -- RF06, RF07
    id_demanda       BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo           VARCHAR(20)  NOT NULL UNIQUE,               -- ex.: DM-2026-001 (gerado por trigger)
    id_confeccao     UUID         NOT NULL
                     REFERENCES confeccao (id_usuario),
    id_categoria     SMALLINT     NOT NULL
                     REFERENCES categoria_servico (id_categoria),
    titulo           VARCHAR(150) NOT NULL,                      -- ex.: Costura reta - Camisa Polo
    descricao        TEXT,
    quantidade       INTEGER      NOT NULL,                      -- ex.: 500 peças
    prazo_dias       INTEGER      NOT NULL,                      -- ex.: 15 dias
    cidade           VARCHAR(80)  NOT NULL,                      -- ex.: Toritama
    uf               CHAR(2)      NOT NULL DEFAULT 'PE',
    status           VARCHAR(20)  NOT NULL DEFAULT 'RECEBENDO_PROPOSTAS',
    data_publicacao  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_demanda_qtd    CHECK (quantidade > 0),
    CONSTRAINT ck_demanda_prazo  CHECK (prazo_dias > 0),
    CONSTRAINT ck_demanda_status CHECK (status IN ('RECEBENDO_PROPOSTAS', 'PAUSADA',
                                    'PROPOSTA_ACEITA', 'EM_EXECUCAO', 'CONCLUIDA', 'ENCERRADA'))
);

CREATE TABLE foto (                                              -- RF05
    id_foto       BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    url           TEXT         NOT NULL,                         -- caminho no storage (Supabase)
    legenda       VARCHAR(150),
    id_faccao     UUID         REFERENCES faccao (id_usuario) ON DELETE CASCADE,
    id_demanda    BIGINT       REFERENCES demanda (id_demanda) ON DELETE CASCADE,
    data_upload   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- a foto pertence a uma facção OU a uma demanda
    CONSTRAINT ck_foto_dono CHECK ((id_faccao IS NOT NULL)::int + (id_demanda IS NOT NULL)::int = 1)
);

CREATE TABLE proposta (                                          -- RF10, RF11, RF12
    id_proposta   BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_demanda    BIGINT        NOT NULL
                  REFERENCES demanda (id_demanda) ON DELETE CASCADE,
    id_faccao     UUID          NOT NULL
                  REFERENCES faccao (id_usuario),
    preco_total   NUMERIC(12,2) NOT NULL,
    prazo_dias    INTEGER       NOT NULL,
    mensagem      TEXT,
    status        VARCHAR(10)   NOT NULL DEFAULT 'ENVIADA',
    data_envio    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    data_resposta TIMESTAMPTZ,
    CONSTRAINT uq_proposta_demanda_faccao UNIQUE (id_demanda, id_faccao),
    CONSTRAINT ck_proposta_preco  CHECK (preco_total > 0),
    CONSTRAINT ck_proposta_prazo  CHECK (prazo_dias > 0),
    CONSTRAINT ck_proposta_status CHECK (status IN ('ENVIADA', 'ACEITA', 'RECUSADA', 'RETIRADA'))
);

CREATE TABLE acordo (                                            -- RF13, RF16
    id_acordo             BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_proposta           BIGINT        NOT NULL UNIQUE         -- 1 proposta aceita gera 1 acordo
                          REFERENCES proposta (id_proposta),
    quantidade            INTEGER       NOT NULL,
    preco_total           NUMERIC(12,2) NOT NULL,
    prazo_dias            INTEGER       NOT NULL,
    data_inicio           DATE          NOT NULL,
    data_prevista_entrega DATE          NOT NULL,
    confirmado_confeccao  BOOLEAN       NOT NULL DEFAULT FALSE,
    confirmado_faccao     BOOLEAN       NOT NULL DEFAULT FALSE,
    data_confirmacao      TIMESTAMPTZ,
    status                VARCHAR(22)   NOT NULL DEFAULT 'AGUARDANDO_CONFIRMACAO',
    data_conclusao        DATE,                                  -- entrega real
    observacoes           TEXT,
    data_registro         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_acordo_valores CHECK (quantidade > 0 AND preco_total > 0 AND prazo_dias > 0),
    CONSTRAINT ck_acordo_datas   CHECK (data_prevista_entrega >= data_inicio),
    CONSTRAINT ck_acordo_status  CHECK (status IN ('AGUARDANDO_CONFIRMACAO', 'EM_EXECUCAO',
                                                   'CONCLUIDO', 'CANCELADO')),
    CONSTRAINT ck_acordo_conclusao CHECK (status <> 'CONCLUIDO' OR data_conclusao IS NOT NULL)
);

-- ---------------------------------------------------------------------
-- 4. AVALIAÇÕES E NOTIFICAÇÕES
-- ---------------------------------------------------------------------
CREATE TABLE avaliacao (                                         -- RF17 (mútua: até 2 por acordo)
    id_avaliacao   BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_acordo      BIGINT      NOT NULL
                   REFERENCES acordo (id_acordo) ON DELETE CASCADE,
    id_avaliador   UUID        NOT NULL REFERENCES usuario (id_usuario),
    id_avaliado    UUID        NOT NULL REFERENCES usuario (id_usuario),
    nota           SMALLINT    NOT NULL,
    comentario     TEXT,
    data_avaliacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_avaliacao_acordo_avaliador UNIQUE (id_acordo, id_avaliador),
    CONSTRAINT ck_avaliacao_nota  CHECK (nota BETWEEN 1 AND 5),
    CONSTRAINT ck_avaliacao_partes CHECK (id_avaliador <> id_avaliado)
);

CREATE TABLE notificacao (                                       -- RF15
    id_notificacao BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario     UUID         NOT NULL
                   REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    tipo           VARCHAR(20)  NOT NULL,
    titulo         VARCHAR(120) NOT NULL,
    mensagem       VARCHAR(300),
    lida           BOOLEAN      NOT NULL DEFAULT FALSE,
    data_criacao   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    id_demanda     BIGINT       REFERENCES demanda (id_demanda)   ON DELETE SET NULL,
    id_proposta    BIGINT       REFERENCES proposta (id_proposta) ON DELETE SET NULL,
    id_acordo      BIGINT       REFERENCES acordo (id_acordo)     ON DELETE SET NULL,
    CONSTRAINT ck_notif_tipo CHECK (tipo IN ('NOVA_DEMANDA', 'NOVA_PROPOSTA', 'PROPOSTA_ACEITA',
                                             'PROPOSTA_RECUSADA', 'PRAZO', 'AVALIACAO', 'MODERACAO'))
);

-- ---------------------------------------------------------------------
-- 5. MODERAÇÃO
-- ---------------------------------------------------------------------
CREATE TABLE denuncia (                                          -- RF19, RF20
    id_denuncia       BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_denunciante    UUID         NOT NULL REFERENCES usuario (id_usuario),
    tipo_alvo         VARCHAR(9)   NOT NULL,
    id_usuario_alvo   UUID         REFERENCES usuario (id_usuario),
    id_demanda_alvo   BIGINT       REFERENCES demanda (id_demanda),
    id_avaliacao_alvo BIGINT       REFERENCES avaliacao (id_avaliacao),
    motivo            VARCHAR(60)  NOT NULL,
    descricao         TEXT,
    status            VARCHAR(12)  NOT NULL DEFAULT 'ABERTA',
    id_admin          UUID         REFERENCES usuario (id_usuario),  -- quem analisou
    parecer           TEXT,
    data_denuncia     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    data_analise      TIMESTAMPTZ,
    CONSTRAINT ck_denuncia_tipo   CHECK (tipo_alvo IN ('PERFIL', 'DEMANDA', 'AVALIACAO')),
    CONSTRAINT ck_denuncia_status CHECK (status IN ('ABERTA', 'EM_ANALISE', 'PROCEDENTE', 'IMPROCEDENTE')),
    -- exatamente um alvo, coerente com tipo_alvo
    CONSTRAINT ck_denuncia_alvo CHECK (
        (tipo_alvo = 'PERFIL'    AND id_usuario_alvo IS NOT NULL AND id_demanda_alvo IS NULL     AND id_avaliacao_alvo IS NULL) OR
        (tipo_alvo = 'DEMANDA'   AND id_demanda_alvo IS NOT NULL AND id_usuario_alvo IS NULL     AND id_avaliacao_alvo IS NULL) OR
        (tipo_alvo = 'AVALIACAO' AND id_avaliacao_alvo IS NOT NULL AND id_usuario_alvo IS NULL   AND id_demanda_alvo IS NULL)
    )
);

CREATE TABLE suspensao (                                         -- RF20
    id_suspensao BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario   UUID        NOT NULL REFERENCES usuario (id_usuario),  -- suspenso
    id_admin     UUID        NOT NULL REFERENCES usuario (id_usuario),  -- quem aplicou
    id_denuncia  BIGINT      REFERENCES denuncia (id_denuncia),
    motivo       VARCHAR(255) NOT NULL,
    data_inicio  TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_fim     TIMESTAMPTZ,                                    -- NULL = por tempo indeterminado
    CONSTRAINT ck_suspensao_datas CHECK (data_fim IS NULL OR data_fim > data_inicio)
);

-- ---------------------------------------------------------------------
-- 6. ÍNDICES (buscas e filtros: RF08, RF09)
-- ---------------------------------------------------------------------
CREATE INDEX idx_demanda_busca      ON demanda (status, id_categoria, cidade);
CREATE INDEX idx_demanda_confeccao  ON demanda (id_confeccao);
CREATE INDEX idx_faccao_cidade      ON faccao (cidade, disponivel_agora);
CREATE INDEX idx_proposta_faccao    ON proposta (id_faccao);
CREATE INDEX idx_capacidade_semana  ON capacidade_semanal (semana_inicio);
CREATE INDEX idx_agenda_faccao      ON periodo_agenda (id_faccao, data_inicio, data_fim);
CREATE INDEX idx_avaliacao_avaliado ON avaliacao (id_avaliado);
CREATE INDEX idx_notif_usuario      ON notificacao (id_usuario, lida);
CREATE INDEX idx_denuncia_status    ON denuncia (status);
CREATE INDEX idx_suspensao_usuario  ON suspensao (id_usuario);

-- ---------------------------------------------------------------------
-- 7. CÓDIGO AUTOMÁTICO DA DEMANDA (ex.: DM-2026-001)
-- ---------------------------------------------------------------------
CREATE SEQUENCE seq_codigo_demanda START 1;

CREATE OR REPLACE FUNCTION fn_gerar_codigo_demanda() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo IS NULL THEN
        NEW.codigo := 'DM-' || to_char(now(), 'YYYY') || '-' ||
                      lpad(nextval('seq_codigo_demanda')::text, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_codigo_demanda
    BEFORE INSERT ON demanda
    FOR EACH ROW EXECUTE FUNCTION fn_gerar_codigo_demanda();

-- ---------------------------------------------------------------------
-- 8. VIEW DE REPUTAÇÃO DA FACÇÃO (RF18)
-- média de avaliações + taxa de entregas no prazo
-- ---------------------------------------------------------------------
CREATE VIEW vw_reputacao_faccao AS
SELECT
    f.id_usuario AS id_faccao,
    f.nome_fantasia,
    (SELECT ROUND(AVG(a.nota), 2) FROM avaliacao a WHERE a.id_avaliado = f.id_usuario) AS media_avaliacoes,
    (SELECT COUNT(*)              FROM avaliacao a WHERE a.id_avaliado = f.id_usuario) AS total_avaliacoes,
    COUNT(ac.id_acordo) FILTER (WHERE ac.status = 'CONCLUIDO') AS entregas_concluidas,
    COUNT(ac.id_acordo) FILTER (WHERE ac.status = 'CONCLUIDO'
                                  AND ac.data_conclusao <= ac.data_prevista_entrega) AS entregas_no_prazo,
    ROUND(100.0 * COUNT(ac.id_acordo) FILTER (WHERE ac.status = 'CONCLUIDO'
                                                AND ac.data_conclusao <= ac.data_prevista_entrega)
          / NULLIF(COUNT(ac.id_acordo) FILTER (WHERE ac.status = 'CONCLUIDO'), 0), 1) AS taxa_pontualidade
FROM faccao f
LEFT JOIN proposta p  ON p.id_faccao = f.id_usuario AND p.status = 'ACEITA'
LEFT JOIN acordo   ac ON ac.id_proposta = p.id_proposta
GROUP BY f.id_usuario, f.nome_fantasia;

-- ---------------------------------------------------------------------
-- 9. DADOS INICIAIS (categorias de serviço mantidas pelo administrador)
-- ---------------------------------------------------------------------
INSERT INTO categoria_servico (nome, descricao) VALUES
    ('Costura',     'Costura reta, overlock, interlock e montagem de peças'),
    ('Corte',       'Corte manual ou enfesto e corte de tecidos'),
    ('Bordado',     'Bordados computadorizados e manuais'),
    ('Estamparia',  'Serigrafia, sublimação e transfer'),
    ('Acabamento',  'Travete, botão, casa, limpeza de fios, passadoria e embalagem');
