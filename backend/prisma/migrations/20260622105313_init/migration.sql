-- CreateEnum
CREATE TYPE "GestacaoStatus" AS ENUM ('gestacao', 'puerperio', 'concluida', 'interrompida');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('masculino', 'feminino', 'indeterminado');

-- CreateEnum
CREATE TYPE "FaseMedicao" AS ENUM ('gestacional', 'nascimento', 'pediatrica');

-- CreateEnum
CREATE TYPE "PapelParticipacao" AS ENUM ('parceiro', 'familia');

-- CreateEnum
CREATE TYPE "StatusParticipacao" AS ENUM ('pendente', 'aceito', 'recusado');

-- CreateEnum
CREATE TYPE "AbaPermissao" AS ENUM ('feed', 'gestacao', 'humor', 'calendario', 'bebe');

-- CreateEnum
CREATE TYPE "AcaoPermissao" AS ENUM ('ver', 'criar', 'curtir', 'comentar');

-- CreateEnum
CREATE TYPE "TipoHumor" AS ENUM ('feliz', 'tranquila', 'ansiosa', 'triste', 'irritada', 'cansada');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('consulta', 'exame', 'vacina', 'pediatria', 'outro');

-- CreateEnum
CREATE TYPE "TipoAnexo" AS ENUM ('laudo', 'imagem', 'documento');

-- CreateEnum
CREATE TYPE "TipoUnidadeSaude" AS ENUM ('ubs', 'hospital', 'maternidade', 'laboratorio', 'outro');

-- CreateEnum
CREATE TYPE "CategoriaDica" AS ENUM ('desenvolvimento', 'marco', 'alimentacao', 'saude', 'bem_estar');

-- CreateEnum
CREATE TYPE "FaseConteudo" AS ENUM ('gestacional', 'infantil');

-- CreateEnum
CREATE TYPE "UnidadeIdade" AS ENUM ('semana', 'mes');

-- CreateEnum
CREATE TYPE "PrioridadeRec" AS ENUM ('normal', 'importante', 'prioritaria');

-- CreateEnum
CREATE TYPE "TipoRecomendacao" AS ENUM ('vacina', 'cuidado', 'alerta', 'exame');

-- CreateEnum
CREATE TYPE "StatusConvite" AS ENUM ('pendente', 'aceito', 'recusado', 'expirado');

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "auth_uid" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "data_nascimento" DATE,
    "municipio_id" INTEGER,
    "consentimento_em" TIMESTAMP(3),
    "versao_termos" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestacao" (
    "id" SERIAL NOT NULL,
    "gestante_id" INTEGER NOT NULL,
    "dum" DATE,
    "dpp" DATE,
    "status" "GestacaoStatus" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gestacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bebe" (
    "id" SERIAL NOT NULL,
    "gestacao_id" INTEGER NOT NULL,
    "nome" TEXT,
    "sexo" "Sexo",
    "data_nascimento" DATE,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bebe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicao_bebe" (
    "id" SERIAL NOT NULL,
    "bebe_id" INTEGER NOT NULL,
    "registrado_por" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "fase" "FaseMedicao" NOT NULL,
    "peso" DECIMAL(6,3),
    "comprimento" DECIMAL(5,2),
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicao_bebe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participacao" (
    "id" SERIAL NOT NULL,
    "gestacao_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "papel" "PapelParticipacao" NOT NULL,
    "status_convite" "StatusParticipacao" NOT NULL,
    "data_entrada" DATE,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissao" (
    "id" SERIAL NOT NULL,
    "participacao_id" INTEGER NOT NULL,
    "aba" "AbaPermissao" NOT NULL,
    "acao" "AcaoPermissao" NOT NULL,
    "permitido" BOOLEAN NOT NULL,

    CONSTRAINT "permissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_humor" (
    "id" SERIAL NOT NULL,
    "gestacao_id" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "humor" "TipoHumor" NOT NULL,
    "nota" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_humor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postagem" (
    "id" SERIAL NOT NULL,
    "gestacao_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "url_midia" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "postagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curtida" (
    "id" SERIAL NOT NULL,
    "postagem_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curtida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentario" (
    "id" SERIAL NOT NULL,
    "postagem_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "comentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_calendario" (
    "id" SERIAL NOT NULL,
    "gestacao_id" INTEGER NOT NULL,
    "bebe_id" INTEGER,
    "criado_por" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "unidade_saude_id" INTEGER,
    "endereco_livre" TEXT,
    "recomendacao_id" INTEGER,
    "observacao" TEXT,
    "lembrete_minutos_antes" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evento_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexo_evento" (
    "id" SERIAL NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "enviado_por" INTEGER NOT NULL,
    "tipo" "TipoAnexo" NOT NULL,
    "s3_key" TEXT NOT NULL,
    "content_type" TEXT,
    "tamanho_bytes" INTEGER,
    "descricao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "anexo_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convite" (
    "id" SERIAL NOT NULL,
    "gestacao_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "papel" "PapelParticipacao" NOT NULL,
    "token" UUID NOT NULL,
    "status" "StatusConvite" NOT NULL DEFAULT 'pendente',
    "expira_em" TIMESTAMP(3) NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aceito_em" TIMESTAMP(3),

    CONSTRAINT "convite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipio" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "codigo_ibge" TEXT,
    "regiao_fruta_id" INTEGER,

    CONSTRAINT "municipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidade_saude" (
    "id" SERIAL NOT NULL,
    "municipio_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoUnidadeSaude" NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "google_place_id" TEXT,
    "telefone" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "unidade_saude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dica" (
    "id" SERIAL NOT NULL,
    "categoria" "CategoriaDica" NOT NULL,
    "fase" "FaseConteudo" NOT NULL,
    "unidade" "UnidadeIdade" NOT NULL,
    "idade_inicio" INTEGER NOT NULL,
    "idade_fim" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,

    CONSTRAINT "dica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regiao_fruta" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "regiao_fruta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tamanho_semana" (
    "semana" INTEGER NOT NULL,
    "comprimento_cm" DECIMAL(5,2),
    "peso_g" DECIMAL(7,2),

    CONSTRAINT "tamanho_semana_pkey" PRIMARY KEY ("semana")
);

-- CreateTable
CREATE TABLE "comparacao_tamanho" (
    "semana" INTEGER NOT NULL,
    "regiao_fruta_id" INTEGER NOT NULL,
    "fruta" TEXT NOT NULL,
    "imagem_url" TEXT NOT NULL,

    CONSTRAINT "comparacao_tamanho_pkey" PRIMARY KEY ("semana","regiao_fruta_id")
);

-- CreateTable
CREATE TABLE "recomendacao" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoRecomendacao" NOT NULL,
    "fase" "FaseConteudo" NOT NULL,
    "unidade" "UnidadeIdade" NOT NULL,
    "idade_inicio" INTEGER NOT NULL,
    "idade_fim" INTEGER NOT NULL,
    "prioridade" "PrioridadeRec" NOT NULL DEFAULT 'normal',
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "recomendacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_auth_uid_key" ON "usuario"("auth_uid");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "gestacao_gestante_id_idx" ON "gestacao"("gestante_id");

-- CreateIndex
CREATE INDEX "bebe_gestacao_id_idx" ON "bebe"("gestacao_id");

-- CreateIndex
CREATE INDEX "medicao_bebe_bebe_id_data_idx" ON "medicao_bebe"("bebe_id", "data");

-- CreateIndex
CREATE INDEX "participacao_usuario_id_idx" ON "participacao"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "participacao_gestacao_id_usuario_id_key" ON "participacao"("gestacao_id", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissao_participacao_id_aba_acao_key" ON "permissao"("participacao_id", "aba", "acao");

-- CreateIndex
CREATE INDEX "registro_humor_gestacao_id_data_idx" ON "registro_humor"("gestacao_id", "data");

-- CreateIndex
CREATE UNIQUE INDEX "curtida_postagem_id_usuario_id_key" ON "curtida"("postagem_id", "usuario_id");

-- CreateIndex
CREATE INDEX "evento_calendario_gestacao_id_data_hora_idx" ON "evento_calendario"("gestacao_id", "data_hora");

-- CreateIndex
CREATE UNIQUE INDEX "convite_token_key" ON "convite"("token");

-- CreateIndex
CREATE INDEX "convite_gestacao_id_idx" ON "convite"("gestacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "municipio_codigo_ibge_key" ON "municipio"("codigo_ibge");

-- CreateIndex
CREATE INDEX "unidade_saude_municipio_id_idx" ON "unidade_saude"("municipio_id");

-- CreateIndex
CREATE INDEX "unidade_saude_municipio_id_tipo_idx" ON "unidade_saude"("municipio_id", "tipo");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestacao" ADD CONSTRAINT "gestacao_gestante_id_fkey" FOREIGN KEY ("gestante_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bebe" ADD CONSTRAINT "bebe_gestacao_id_fkey" FOREIGN KEY ("gestacao_id") REFERENCES "gestacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicao_bebe" ADD CONSTRAINT "medicao_bebe_bebe_id_fkey" FOREIGN KEY ("bebe_id") REFERENCES "bebe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicao_bebe" ADD CONSTRAINT "medicao_bebe_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacao" ADD CONSTRAINT "participacao_gestacao_id_fkey" FOREIGN KEY ("gestacao_id") REFERENCES "gestacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacao" ADD CONSTRAINT "participacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissao" ADD CONSTRAINT "permissao_participacao_id_fkey" FOREIGN KEY ("participacao_id") REFERENCES "participacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_humor" ADD CONSTRAINT "registro_humor_gestacao_id_fkey" FOREIGN KEY ("gestacao_id") REFERENCES "gestacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postagem" ADD CONSTRAINT "postagem_gestacao_id_fkey" FOREIGN KEY ("gestacao_id") REFERENCES "gestacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postagem" ADD CONSTRAINT "postagem_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curtida" ADD CONSTRAINT "curtida_postagem_id_fkey" FOREIGN KEY ("postagem_id") REFERENCES "postagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curtida" ADD CONSTRAINT "curtida_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentario" ADD CONSTRAINT "comentario_postagem_id_fkey" FOREIGN KEY ("postagem_id") REFERENCES "postagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentario" ADD CONSTRAINT "comentario_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_calendario" ADD CONSTRAINT "evento_calendario_gestacao_id_fkey" FOREIGN KEY ("gestacao_id") REFERENCES "gestacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_calendario" ADD CONSTRAINT "evento_calendario_bebe_id_fkey" FOREIGN KEY ("bebe_id") REFERENCES "bebe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_calendario" ADD CONSTRAINT "evento_calendario_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_calendario" ADD CONSTRAINT "evento_calendario_unidade_saude_id_fkey" FOREIGN KEY ("unidade_saude_id") REFERENCES "unidade_saude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_calendario" ADD CONSTRAINT "evento_calendario_recomendacao_id_fkey" FOREIGN KEY ("recomendacao_id") REFERENCES "recomendacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_evento" ADD CONSTRAINT "anexo_evento_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "evento_calendario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_evento" ADD CONSTRAINT "anexo_evento_enviado_por_fkey" FOREIGN KEY ("enviado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convite" ADD CONSTRAINT "convite_gestacao_id_fkey" FOREIGN KEY ("gestacao_id") REFERENCES "gestacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convite" ADD CONSTRAINT "convite_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipio" ADD CONSTRAINT "municipio_regiao_fruta_id_fkey" FOREIGN KEY ("regiao_fruta_id") REFERENCES "regiao_fruta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidade_saude" ADD CONSTRAINT "unidade_saude_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparacao_tamanho" ADD CONSTRAINT "comparacao_tamanho_semana_fkey" FOREIGN KEY ("semana") REFERENCES "tamanho_semana"("semana") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparacao_tamanho" ADD CONSTRAINT "comparacao_tamanho_regiao_fruta_id_fkey" FOREIGN KEY ("regiao_fruta_id") REFERENCES "regiao_fruta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Índices parciais (não expressáveis no schema Prisma)
CREATE INDEX "ix_postagem_feed" ON "postagem" ("gestacao_id", "data" DESC) WHERE "deleted_at" IS NULL;
CREATE INDEX "ix_comentario_postagem" ON "comentario" ("postagem_id") WHERE "deleted_at" IS NULL;
CREATE INDEX "ix_evento_bebe_data" ON "evento_calendario" ("bebe_id", "data_hora") WHERE "bebe_id" IS NOT NULL;
CREATE INDEX "ix_anexo_evento" ON "anexo_evento" ("evento_id") WHERE "deleted_at" IS NULL;
CREATE INDEX "ix_evento_recomendacao" ON "evento_calendario" ("gestacao_id", "recomendacao_id") WHERE "recomendacao_id" IS NOT NULL;

-- CHECKs de integridade
ALTER TABLE "gestacao" ADD CONSTRAINT "ck_gestacao_ancora"
  CHECK ("dpp" IS NOT NULL OR "dum" IS NOT NULL);
ALTER TABLE "evento_calendario" ADD CONSTRAINT "ck_evento_local_xor"
  CHECK (NOT ("unidade_saude_id" IS NOT NULL AND "endereco_livre" IS NOT NULL));
ALTER TABLE "evento_calendario" ADD CONSTRAINT "ck_evento_lembrete"
  CHECK ("lembrete_minutos_antes" IS NULL OR "lembrete_minutos_antes" >= 0);
ALTER TABLE "dica" ADD CONSTRAINT "ck_dica_idade" CHECK ("idade_inicio" <= "idade_fim");
ALTER TABLE "dica" ADD CONSTRAINT "ck_dica_fase_unidade"
  CHECK (("fase" = 'gestacional' AND "unidade" = 'semana') OR ("fase" = 'infantil' AND "unidade" = 'mes'));
ALTER TABLE "recomendacao" ADD CONSTRAINT "ck_rec_idade" CHECK ("idade_inicio" <= "idade_fim");
ALTER TABLE "recomendacao" ADD CONSTRAINT "ck_rec_fase_unidade"
  CHECK (("fase" = 'gestacional' AND "unidade" = 'semana') OR ("fase" = 'infantil' AND "unidade" = 'mes'));
