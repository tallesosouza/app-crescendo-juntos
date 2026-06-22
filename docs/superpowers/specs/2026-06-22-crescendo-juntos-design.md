# Design — Crescendo Juntos

> Documento de design validado na sessão de brainstorming de 2026-06-22.
> Stack: **NestJS 11** (backend) + **Angular 22** (frontend), sob **Clean Architecture, SOLID e Clean Code**.
> Base de dados: modelo ER completo em [`docs/er_modelo.md`](../../er_modelo.md).

## 1. Visão geral e escopo

**Crescendo Juntos** é um webApp (PWA) de acompanhamento da jornada gestação → puerpério, com
participação de parceiro/família, feed de postagens, calendário, catálogos por idade gestacional e
acompanhamento do bebê.

### Estratégia de entrega

- **Banco:** o **schema inteiro do ER** é criado agora (Prisma migrate), mesmo que a UI venha por incrementos.
- **Entregas incrementais.** Esta spec cobre a **primeira entrega**: **Login + Cadastro + Onboarding**.
- **v1 (MVP geral):** todo o ER, incluindo feed/postagens, calendário, anexos S3 (presigned URL),
  catálogos (tamanho/fruta, dicas, recomendações) e bebê/medições.
- **v2 (futuro):** Azure AD (login corporativo), mapa de unidades de saúde com Google Places,
  contador de contrações, lembretes múltiplos por evento, PostGIS.
- **Sem chat conversacional.** Apenas postagens com interações (curtir/comentar).

## 2. Arquitetura geral

```
┌─────────────┐   1. signup/login (SDK)   ┌──────────────┐
│  Angular 22 │ ────────────────────────► │ Supabase Auth│
│  (Vercel)   │ ◄──────── JWT ─────────────│ (identidade) │
└─────┬───────┘                            └──────────────┘
      │  2. requests com JWT no header
      ▼
┌──────────────────────────────┐   Prisma    ┌──────────────┐
│   NestJS 11 (Render)          │ ──────────► │ AWS RDS      │
│   Clean Architecture          │             │ Postgres     │
│   • valida JWT (JWKS Supabase)│             │ (dados LGPD) │
│   • autoriza via PARTICIPACAO │             └──────────────┘
│     / PERMISSAO               │
└──────────────────────────────┘
```

- **Supabase Auth** guarda apenas **identidade/credenciais** (sem reimplementar hash/reset/verificação).
- **AWS RDS Postgres** guarda os **dados pessoais e de negócio** (decisão de **LGPD**).
- **Angular fala direto com o Supabase** (SDK) para signup/login, recebe o **JWT** e o envia ao NestJS
  em toda requisição. O NestJS **valida** o JWT (via JWKS do Supabase) e cuida da **autorização**.
- **Login apenas usuário/senha** por enquanto. **Azure AD → v2**.

### Camadas do NestJS (Regra de Dependência, de fora para dentro)

1. **Domain** — entidades puras (`Usuario`, `Gestacao`, `Convite`, `Participacao`…), value objects
   (`Dpp`, `Email`), regras de negócio e **interfaces de repositório**. Zero dependência de framework/Prisma.
2. **Application** — use cases (`RealizarOnboardingGestante`, `ConsultarConvite`, `AceitarConvite`,
   `ObterContextoUsuario`). Dependem só de interfaces (portas).
3. **Infrastructure** — implementações: `PrismaXRepository`, cliente Supabase (validação de JWT),
   adaptadores. O Prisma Client vive **só aqui**.
4. **Presentation** — controllers, DTOs, guards (`SupabaseJwtGuard`, futuramente `PermissaoGuard`),
   mapeamento HTTP.

Fluxo: Controller → Use Case (porta) → Repositório (interface) → impl. Prisma. **O domínio nunca
importa nada de fora; o tipo do Prisma nunca vaza para os use cases** (sempre passa pela entidade de domínio).

## 3. Persistência (Prisma) e ajustes no ER

**ORM escolhido: Prisma** — mantém as entidades de domínio limpas (sem decorators), migrations
versionadas, type-safety, e permite SQL bruto para os índices parciais e `CHECK`/enums do ER.

### Deltas em relação ao `er_modelo.md`

1. **`PERMISSAO.aba`** passa a ser `feed|gestacao|humor|calendario|bebe` (**removido `chat`** —
   não há chat conversacional; o controle de acesso à área de postagens é a aba `feed`).

2. **Nova tabela `CONVITE`** (convite de parceiro/família antes de o convidado ter conta):
   ```
   CONVITE {
     int id PK
     int gestacao_id FK
     string email            "para quem foi convidado"
     string papel            "enum: parceiro|familia"
     string token UK         "uuid do link de convite"
     string status           "enum: pendente|aceito|recusado|expirado"
     datetime expira_em
     int criado_por FK       "→ USUARIO (a gestante dona)"
     datetime criado_em
     datetime aceito_em      "nullable"
   }
   ```
   `PARTICIPACAO.usuario_id` continua **obrigatória** e o `UNIQUE(gestacao_id, usuario_id)` intacto.

3. **`USUARIO` ganha consentimento LGPD:** `consentimento_em datetime nullable` +
   `versao_termos string nullable` (gravados no aceite do cadastro).

4. **Enums nativos do Postgres** (em vez de `string`) para `status`, `papel`, `status_convite`,
   `sexo`, `fase`, `humor`, `tipo`, `categoria`, `aba`, `acao`, `unidade`, `prioridade` e o `status` de `CONVITE`.

5. **`ON DELETE` explícito:** `CASCADE` em filhos sem sentido sem o pai
   (POSTAGEM→CURTIDA/COMENTARIO; GESTACAO→BEBE/PARTICIPACAO/REGISTRO_HUMOR; EVENTO→ANEXO);
   `RESTRICT` em catálogos (MUNICIPIO, UNIDADE_SAUDE, REGIAO_FRUTA). Detalhado nas migrations.

6. **Pontos em aberto do ER → v1** (colunas já nascem no schema): mídia do feed (`POSTAGEM.url_midia`)
   e anexos (`ANEXO_EVENTO.s3_key`) via **S3 bucket privado + presigned URL**; imagens de fruta em
   S3 público/CDN. Implementados em incremento posterior da v1.

7. **Pontos em aberto → v2:** unidade canônica de peso em `MEDICAO_BEBE`, lembretes múltiplos
   (`LEMBRETE`), contrações (`SESSAO_CONTRACOES`/`CONTRACAO`), PostGIS.

## 4. Primeira entrega — Login + Cadastro + Onboarding

### Telas / rotas Angular

| Rota | Tela | Guard |
|---|---|---|
| `/login` | Login (email + senha, "esqueci senha", "criar conta") | público |
| `/cadastro` | Cadastro (nome, email, senha, confirmar, **aceite LGPD**) | público |
| `/cadastro?convite=:token` | Cadastro vindo de convite (email pré-preenchido) | público |
| `/onboarding` | Wizard da gestante (3 passos) | autenticado, **sem** gestação |
| `/` (home) | redireciona; placeholder fora do escopo desta entrega | autenticado |

> Nota: o mockup de login (`imagens/login.png`) está **desatualizado** (mostra Google/Instagram/"Usuário").
> Vale o ER: **email + senha** via Supabase, Azure AD só na v2.

### Dois caminhos pós-cadastro

- **Gestante (nova):** Cadastro → Supabase `signUp` (JWT) → Onboarding wizard:
  1. **Perfil:** nome, `data_nascimento`, **município** (select do catálogo).
  2. **Gestação:** DPP (date picker) **ou** «estou em X semanas» (`DPP = hoje + (40 − X)·7`)
     → grava `GESTACAO` (`dpp`, `status=gestacao`). **Bebê (nome/sexo) opcional** nesta etapa.
  3. **Convidar parceiro (opcional, pulável):** email + papel → cria `CONVITE`.
- **Parceiro/família (convidado):** abre `/cadastro?convite=token` → Supabase `signUp` → backend valida
  o token → cria `USUARIO` + `PARTICIPACAO` (papel do convite) + permissões default.
  **Não** passa pelo wizard de gestação.

### Use cases (Application) e endpoints (NestJS)

| Endpoint | Use case | Efeito (transação) |
|---|---|---|
| `POST /onboarding/gestante` | `RealizarOnboardingGestante` | cria/atualiza `USUARIO`, cria `GESTACAO`, cria `CONVITE`(s) |
| `GET /convites/:token` | `ConsultarConvite` | valida token/expiração; retorna gestação+papel para exibir |
| `POST /convites/:token/aceitar` | `AceitarConvite` | cria `USUARIO` + `PARTICIPACAO` + permissões default |
| `GET /me` | `ObterContextoUsuario` | perfil + gestações; decide entre onboarding e home |

**Guards:** `SupabaseJwtGuard` valida a assinatura do JWT (JWKS do Supabase) e extrai `auth_uid`/`email`.
A autorização por `PERMISSAO` entra quando as abas existirem (entregas seguintes).

**Regra de DPP:** a DPP é a **única âncora persistida** da idade gestacional; `semana_atual` é sempre
derivada dela (não persistida). «Estou em X semanas» **recalcula** a DPP.

## 5. Frontend Angular (PWA)

Implementação com a skill **`/angular-developer`** + **`angular-architecture`** (Scope Rule); se o
**MCP oficial do Angular** estiver disponível, também é usado. Angular 22 moderno: **standalone
components**, **signals** para estado, novo control-flow (`@if/@for`), **signal-forms** (não reactive forms).

```
frontend/src/app/
  core/                     # singletons
    auth/                   # SupabaseClient, AuthService (signUp/signIn/signOut, sessão)
    http/                   # interceptor que injeta o JWT; trata 401 → /login
    guards/                 # authGuard, onboardingGuard
  features/
    auth/                   # login, cadastro
    onboarding/             # wizard (perfil → gestação → convite), stepper por signal
  shared/                   # UI reutilizável, pipes
  app.routes.ts             # rotas lazy por feature
```

- **PWA desde o início:** `@angular/pwa` (service worker + `manifest.webmanifest` + ícones/splash a
  partir de `imagens/logo.png`); app shell cacheado; instalável no celular. Habilita push de lembretes na v2.
- **AuthService** encapsula o SDK do Supabase — o resto do app não conhece Supabase diretamente
  (inversão de dependência no front).
- **onboardingGuard** consulta `GET /me`: sem gestação/participação → força `/onboarding`.
- **Tipos compartilhados:** DTOs de request/response em `/shared` (workspace), importados pelos dois lados.
- **Validação** em PT-BR: senha forte, confirmação, email, campos obrigatórios.

## 6. Repositório, deploy e qualidade

### Monorepo (pnpm workspaces)

```
crescendo-juntos/
  package.json            # workspace root
  pnpm-workspace.yaml
  backend/                # NestJS 11 (domain/application/infra/presentation)
    prisma/               # schema.prisma + migrations + seed
  frontend/               # Angular 22 PWA
  shared/                 # DTOs/contratos de tipo
  docs/                   # er_modelo.md + specs
```

### Deploy (free no início)

| Camada | Serviço | Observação |
|---|---|---|
| Frontend Angular | **Vercel** | build estático/SSR |
| Backend NestJS | **Render** | free tier "dorme" → cold start ~30s na 1ª requisição |
| Banco Postgres | **AWS RDS** | free tier db.t3.micro (12 meses); escolhido por LGPD |
| Auth | **Supabase Auth** | free tier; só identidade/credenciais |

### Testes e verificação

| Camada | O que testa | Ferramenta |
|---|---|---|
| Domain/Application (backend) | regras e use cases isolados (repos mockados) — **TDD** | Jest |
| Infrastructure (backend) | repositórios Prisma contra Postgres real | Jest + DB de teste |
| API (backend) | endpoints ponta a ponta | Jest e2e (supertest) |
| Frontend | componentes/serviços (login, cadastro, wizard) e guards | Vitest/Karma |
| Verificação final | **rodar o app real**: cadastrar → onboarding → ver dados no banco | skills `run`/`verify` |

**Disciplina (superpowers):**
- **TDD** em cada use case e regra (vermelho → verde → refatorar).
- **Verification before completion:** nada é declarado pronto sem rodar testes **e** exercitar o fluxo
  real (Supabase signup → JWT → NestJS → linha no RDS). Toda implementação é verificada funcionando de fato.
- Migrations Prisma versionadas; **seed mínimo** da primeira entrega: `MUNICIPIO` (base Ilhéus + alguns).
  Catálogos grandes (frutas, dicas, recomendações) em entregas próprias.

## 7. Decisões registradas

| # | Decisão |
|---|---|
| 1 | Schema completo do ER criado já; UI por entregas incrementais |
| 2 | 1ª entrega = Login + Cadastro + Onboarding |
| 3 | Auth: Supabase Auth (email/senha); Angular↔Supabase; NestJS valida JWT; Azure AD na v2 |
| 4 | Sem chat conversacional; `PERMISSAO.aba` sem `chat` |
| 5 | Convite por tabela `CONVITE` com token |
| 6 | Onboarding informa DPP por date picker **ou** «X semanas» |
| 7 | ORM Prisma |
| 8 | Monorepo pnpm workspaces (backend/frontend/shared) |
| 9 | Deploy: Vercel (front), Render (back), AWS RDS (Postgres), Supabase (auth) |
| 10 | Frontend PWA desde o início; **signal-forms** |
| 11 | Consentimento LGPD em `USUARIO` (`consentimento_em` + `versao_termos`) |
| 12 | Bebê opcional no onboarding |
| 13 | S3 (anexos/mídia) na v1; mapa, contrações, lembretes múltiplos, PostGIS na v2 |
| 14 | Verificação obrigatória: TDD + rodar o fluxo real antes de declarar pronto |
| 15 | **Sem dados mockados:** toda tela lê direto da tabela; catálogos populados por **seed real**; sem dados → **estado vazio** |
| 16 | `UNIDADE_SAUDE` é catálogo **independente** (semeado, visível a todos); vínculo com evento é opcional nos dois sentidos |
| 17 | Lembrete é campo de `EVENTO_CALENDARIO` → construído na F5 (Calendário) |
| 18 | Unidade de saúde na F4 = **listagem/diretório** (abrir no Google Maps via link); mapa interativo (Google Places) → v2 |

## 8. Roadmap de fases

O banco inteiro nasce na **F0**; as fases seguintes apenas passam a *usar* tabelas que já existem.
Nenhuma tela usa mock — cada uma lê da tabela real (vazia se não houver seed). Ordem podendo
ser reavaliada se surgir dependência.

| Fase | Entrega | Escopo principal |
|---|---|---|
| **F0** | Estruturação do projeto | Monorepo (pnpm), NestJS Clean Arch + `SupabaseJwtGuard`, Angular 22 PWA + AuthService/interceptor/guards, **Prisma migrate do schema INTEIRO**, seed mínimo (MUNICIPIO/Ilhéus), deploys Render + Vercel |
| **F1** | Login + Cadastro + Onboarding | Auth Supabase, wizard signal-forms, aceite LGPD, `CONVITE`/aceitar convite, `GET /me` |
| **F2** | Início (home) | Semana atual e derivações da DPP, "Dica do dia", "tamanho do bebê" — lê catálogos reais |
| **F3** | Meu Bebê | CRUD `BEBE`, `MEDICAO_BEBE`, gráfico de crescimento, fruta da semana + marcos (catálogos reais) |
| **F4** | Família + Unidade de saúde | `POSTAGEM`/`CURTIDA`/`COMENTARIO`, `PermissaoGuard`, membros/convite via UI, mídia S3; **diretório de unidades de saúde** (seed + listagem + link p/ Google Maps) |
| **F5** | Calendário | `EVENTO_CALENDARIO` (consulta/exame/vacina), **lembrete**, "marcar recomendação como feita", `ANEXO_EVENTO` (S3 presigned) |
| **F6** | Humor | `REGISTRO_HUMOR` (diário/timeline) |
| **v2** | Futuro | Azure AD, mapa interativo Google Places, contador de contrações, lembretes múltiplos (`LEMBRETE`), PostGIS |

### Catálogos (seed, sem mock)

Cada catálogo é populado por `INSERT` assim que sua tabela existe; a tela lê direto dele:
`MUNICIPIO` (F0), `TAMANHO_SEMANA`/`COMPARACAO_TAMANHO`/`REGIAO_FRUTA`/`DICA`/`RECOMENDACAO` (F2–F3),
`UNIDADE_SAUDE` (F4). Sem dados → estado vazio na UI.
