# F1 — Login + Cadastro + Onboarding — Design

> Refinamento da primeira entrega descrita em `docs/superpowers/specs/2026-06-22-crescendo-juntos-design.md` (seção 4),
> validado em sessão de brainstorming de 2026-06-22. Lê-se em conjunto com aquele documento (arquitetura geral,
> deltas do ER, decisões registradas) e com `docs/er_modelo.md`.

## 1. Escopo desta entrega

Login, cadastro, confirmação de e-mail, recuperação de senha, onboarding da gestante (perfil → gestação →
convite opcional) e fluxo de convite para parceiro/família (link genérico, não atado a e-mail). Documentação
Swagger do backend (retroativa ao `/health` da F0 + todos os endpoints novos). Estrutura de UI do frontend em
Atomic Design dentro de `shared/ui`.

Fora de escopo: feed/postagens, calendário, humor, unidade de saúde, catálogos (F2 em diante); Azure AD,
envio automático de e-mail de convite, mapa interativo (v2).

## 2. Mudança no schema (Prisma)

`CONVITE.email` passa de obrigatório para **opcional** (`String?`). O convite é um link genérico por papel
(`parceiro` | `familia`), gerado pela gestante e compartilhado manualmente (WhatsApp, etc.) — não é mais
direcionado a um e-mail específico. `expira_em` continua sendo `criado_em + 7 dias`; o token também se torna
inválido assim que `status` deixa de ser `pendente` (uso único, mesmo dentro da janela de 7 dias).

Migration: `ALTER TABLE convite ALTER COLUMN email DROP NOT NULL`.

## 3. Backend (NestJS, Clean Architecture)

**Domain** (`backend/src/domain`): entidades `Usuario`, `Gestacao`, `Bebe`, `Convite`, `Participacao` +
interfaces de repositório (`UsuarioRepository`, `GestacaoRepository`, `ConviteRepository`,
`ParticipacaoRepository`). Value objects: `Dpp` (deriva `semana_atual`; nunca persistida), `Email`.

**Application** (use cases, testados com repositórios mockados — TDD):

| Use case | Endpoint | Efeito (transação) |
|---|---|---|
| `RealizarOnboardingGestante` | `POST /onboarding/gestante` | atualiza `Usuario` (nome/data_nascimento/município/consentimento+versao_termos), cria `Gestacao`, cria `Bebe` **só se houver dado preenchido**, cria `Convite`(s) se solicitado nesse passo |
| `GerarConvite` | `POST /convites` | cria um `Convite` (papel, sem e-mail, `expira_em = +7d`) para a gestação do usuário autenticado |
| `ConsultarConvite` | `GET /convites/:token` | valida token (existe, `status=pendente`, não expirado); retorna papel + nome da gestante (sem outras PII) |
| `AceitarConvite` | `POST /convites/:token/aceitar` | usa `auth_uid`/email do JWT da requisição atual; cria `Usuario` se ainda não existir; sempre cria `Participacao` (papel do convite) + permissões default; marca `Convite.status=aceito`, `aceito_em=now()` |
| `ObterContextoUsuario` | `GET /me` | perfil + gestações/participações; front decide entre onboarding e home |
| `SolicitarRedefinicaoSenha` | `POST /auth/esqueci-senha` | repassa para Supabase `resetPasswordForEmail` (sem expor se o e-mail existe) |

**Infrastructure**: `PrismaUsuarioRepository`, `PrismaGestacaoRepository`, `PrismaBebeRepository`,
`PrismaConviteRepository`, `PrismaParticipacaoRepository` (Prisma Client só aqui). `SupabaseJwksClient`
(busca e cacheia chaves JWKS para validação RS256).

**Presentation**: controllers para os endpoints acima + `SupabaseJwtGuard` (valida assinatura via JWKS,
extrai `auth_uid`/`email` para `request.user`). DTOs de request/response em `@crescendo/shared`.

**Transações**: `RealizarOnboardingGestante` e `AceitarConvite` usam `prisma.$transaction`.

### Swagger

- `@nestjs/swagger` instalado; `SwaggerModule.setup('docs', app, document)` em `main.ts`, `DocumentBuilder`
  com título/descrição e esquema de **bearer auth** (JWT).
- `@ApiTags`/`@ApiOperation`/`@ApiResponse` em **todos** os controllers, incluindo o `HealthController`
  já existente (retroativo).
- DTOs (request/response) decorados com `@ApiProperty`.
- Servido em `/docs` (ao menos em dev; expor em produção fica a confirmar antes do deploy do F1).

## 4. Frontend (Angular 22 PWA)

| Rota | Tela | Guard |
|---|---|---|
| `/login` | Login (email+senha, "esqueci senha") | público (`guestGuard`) |
| `/cadastro` | Cadastro (nome, email, senha, confirmar, aceite LGPD) | público (`guestGuard`) |
| `/termos` | Termos/Privacidade (texto fixo, versão `v1`) | público |
| `/esqueci-senha` | Solicitar e-mail de redefinição | público |
| `/redefinir-senha` | Definir nova senha (a partir do link do e-mail Supabase) | público |
| `/confirmar-email` | "Verifique seu e-mail" pós-cadastro | público |
| `/convite/:token` | Mostra convite (papel, quem convidou) + "Entrar"/"Criar conta"; se já logado, aceita direto | público |
| `/onboarding` | Wizard 3 passos (perfil → gestação → convidar) | `authGuard` + `onboardingGuard` (sem gestação) |
| `/` (home) | Placeholder; decide via `GET /me` se vai para onboarding | `authGuard` |

### Estrutura de pastas

```
frontend/src/app/
  core/
    auth/         # AuthService (signUp/signIn/signOut/resetPassword, sessão como signal)
    http/         # interceptor injeta JWT; trata 401 → /login
    guards/       # authGuard, onboardingGuard, guestGuard
  features/
    auth/         # login, cadastro, esqueci-senha, redefinir-senha, confirmar-email
    convite/      # tela do convite (/convite/:token)
    onboarding/   # wizard (perfil → gestação → convite), signal-forms, stepper por signal
  shared/
    ui/                  # Atomic Design — componentes de apresentação puros, sem lógica de negócio
      atoms/              # botão, input, checkbox, spinner, label-erro...
      molecules/          # campo-com-erro (label+input+mensagem), card, stepper-item...
      organisms/          # formulário de login, formulário de cadastro, passo do wizard...
      templates/          # layout de página pública (auth), layout autenticado
    pipes/
  app.routes.ts          # rotas lazy por feature
```

Atomic Design se aplica **somente** dentro de `shared/ui`; `core/` (infraestrutura técnica) e `features/`
(organização por domínio/funcionalidade) seguem a Scope Rule do design original.

### Fluxos

**Gestante (nova):** `/cadastro` → Supabase `signUp` → `/confirmar-email` → confirma e-mail → `/login` →
`/onboarding`: (1) Perfil — nome, data_nascimento, município; (2) Gestação — DPP por date picker **ou**
«estou em X semanas» (recalcula DPP), bebê opcional (nome/sexo/data — só cria `Bebe` se algo for
preenchido); (3) Convidar — opcional/pulável, gera link via `POST /convites` e mostra "copiar/compartilhar"
(sem envio automático de e-mail) → `/` (home placeholder).

**Parceiro/família (convidado):** abre `/convite/:token` → `GET /convites/:token` mostra quem convidou e o
papel → escolhe "Entrar" ou "Criar conta": se criar conta, passa por `/confirmar-email` antes de continuar;
se já tem sessão ativa, o aceite ocorre direto → `POST /convites/:token/aceitar` (usa o JWT atual, não
valida e-mail contra o convite, pois o link é genérico) → `/` (home; **não** passa pelo wizard).

**Esqueci a senha:** `/esqueci-senha` → `POST /auth/esqueci-senha` (repassa a Supabase) → e-mail com link →
`/redefinir-senha` (sessão de recuperação do Supabase) → nova senha → `/login`.

## 5. Testes e verificação

| Camada | O que testa | Ferramenta |
|---|---|---|
| Domain/Application | regras (`Dpp`, validade/uso único de convite) e use cases isolados (repos mockados) — TDD vermelho→verde | Jest |
| Infrastructure | repositórios Prisma contra Postgres real (docker-compose) | Jest + DB de teste |
| API | endpoints ponta a ponta (JWT de teste → onboarding → convite → me) | Jest e2e (supertest) |
| Frontend | `AuthService`, guards, componentes atomic (atoms/molecules/organisms) e wizard | **Vitest** |
| Swagger | `/docs` carrega e lista todos os endpoints do F1 + `/health` | verificação manual (browser/curl) |
| Verificação final | fluxo real: cadastro → confirmar e-mail → login → onboarding → conferir linhas em `usuario`/`gestacao`/`bebe`/`convite` no Postgres local; aceitar convite em outra sessão/navegador | skills `run`/`verify` |

Disciplina: TDD em cada use case e regra de domínio; nenhuma task é declarada concluída sem rodar o fluxo
de ponta a ponta de fato (não basta passar os testes automatizados).

## 6. Decisões registradas (adicionais às da spec geral)

| # | Decisão |
|---|---|
| F1-1 | "Esqueci senha" entra nesta entrega (via Supabase `resetPasswordForEmail`) |
| F1-2 | Confirmação de e-mail obrigatória no Supabase antes do primeiro login |
| F1-3 | Convite expira em 7 dias; também se torna inválido após o primeiro uso |
| F1-4 | `Bebe` só é criado no onboarding se algum dado (nome/sexo/data) for preenchido |
| F1-5 | Página `/termos` com texto fixo, versão `v1`, linkada no checkbox de aceite do cadastro |
| F1-6 | Convite é link genérico (sem e-mail obrigatório); `CONVITE.email` torna-se opcional no schema |
| F1-7 | Convite enviado por compartilhamento manual (copiar link); sem serviço de e-mail de convite nesta entrega |
| F1-8 | Aceite de convite não valida e-mail contra o convite — qualquer conta autenticada pode aceitar um token válido |
| F1-9 | Entrada do convite é uma rota dedicada `/convite/:token` (não reaproveita `/cadastro`) |
| F1-10 | `SupabaseJwtGuard` valida JWT via JWKS remoto (com cache), sem round-trip por requisição ao Supabase |
| F1-11 | Swagger (`@nestjs/swagger`) com prioridade máxima: documenta `/health` (retroativo) + todos os endpoints do F1, servido em `/docs` |
| F1-12 | Frontend usa Atomic Design (atoms/molecules/organisms/templates) somente dentro de `shared/ui`; `core/`/`features/` seguem a Scope Rule |
| F1-13 | Testes de frontend com **Vitest** (não Karma) |

## 7. Notas conscientes (a confirmar na implementação)

- Exposição do `/docs` (Swagger) em produção (Render) — decidir antes do deploy do F1; por padrão ativo em
  todos os ambientes até decisão em contrário.
- Texto real de termos/política de privacidade fica para revisão jurídica futura; `v1` é um placeholder de
  conteúdo, não placeholder de funcionalidade (o fluxo de aceite/versionamento é real).
