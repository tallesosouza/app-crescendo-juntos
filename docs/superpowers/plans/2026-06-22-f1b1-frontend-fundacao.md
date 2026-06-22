# F1b-1 — Frontend Fundação (Angular 22 PWA) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a infraestrutura do frontend Angular da F1 — configuração de ambiente, cliente Supabase + `AuthService`, interceptor de JWT, `ApiService` tipado (wrappers dos 7 endpoints da F1a), guards de rota, persistência do token de convite e a base de UI atômica em `shared/ui` — tudo testado em Vitest, pronto para as telas (F1b-2) consumirem.

**Architecture:** Angular 22 standalone + signals. `core/` concentra a infraestrutura técnica (auth/http/api/guards) e segue a Scope Rule; `shared/ui/` segue Atomic Design (atoms→molecules→templates), com componentes de apresentação puros. O `AuthService` encapsula o SDK do Supabase (injetado por token, para teste); o resto do app não conhece Supabase. O `ApiService` encapsula o `HttpClient` contra a API F1a. Os contratos de `@crescendo/shared` entram **só como tipos** (resolvidos por `paths` no tsconfig — sumem na compilação, sem dependência de runtime).

**Tech Stack:** Angular 22 (standalone, signals, functional guards/interceptors) · `@supabase/supabase-js` v2 · Vitest (`@angular/build:unit-test`) + jsdom · TypeScript 5/6 · pnpm 10.

## Global Constraints

- **Node:** 22+ (ambiente real: Node 24). **pnpm:** 10 (gerenciador único). pnpm 10 bloqueia build scripts de deps por padrão — `@supabase/supabase-js` é JS puro, sem build script.
- **Angular 22 moderno:** standalone components, **signals** para estado, `inject()`, functional guards (`CanActivateFn`) e functional interceptors (`HttpInterceptorFn`). Sem NgModules. Sem reactive forms aqui (signal-forms entram nas telas, F1b-2).
- **Atomic Design só em `shared/ui`** (atoms/molecules/organisms/templates). `core/` e `features/` seguem a Scope Rule (organização por função/domínio).
- **Supabase encapsulado:** somente `AuthService` (e o token `SUPABASE_CLIENT`) tocam o SDK. Componentes/serviços nunca importam `@supabase/supabase-js` direto.
- **Contratos compartilhados:** importar de `@crescendo/shared` **com `import type`** (são interfaces puras). Resolvidos por `paths` no tsconfig → `../shared/src/index.ts`. Não adicionar `@crescendo/shared` ao `package.json` do frontend (é type-only).
- **Comandos:** Git Bash; testes `pnpm --filter frontend test` (= `ng test`, Vitest, não-watch por padrão no builder); build `pnpm --filter frontend build`; typecheck via build ou `pnpm --filter frontend exec tsc -p tsconfig.app.json --noEmit`.
- **Backend (F1a) já entrega** os endpoints consumidos aqui: `GET /me`, `GET /municipios`, `POST /onboarding/gestante`, `POST /convites`, `GET /convites/:token`, `POST /convites/:token/aceitar`, `POST /auth/esqueci-senha`. Base URL via `environment.apiBaseUrl`.
- **TDD**; commits frequentes (um por task no mínimo).

---

## File Structure

```
frontend/
  package.json                                  # (modify) + @supabase/supabase-js
  angular.json                                  # (modify) fileReplacements de environment
  tsconfig.json                                 # (modify) paths @crescendo/shared
  src/environments/
    environment.ts                              # (create) produção (apiBaseUrl/supabase*)
    environment.development.ts                  # (create) dev
  src/app/
    app.config.ts                               # (modify) provideHttpClient(withInterceptors([authInterceptor]))
    core/
      auth/
        supabase-client.ts                      # token SUPABASE_CLIENT (factory createClient)
        auth.service.ts (+ .spec)               # signUp/signIn/signOut/updatePassword + sessão como signal
        pending-invite.service.ts (+ .spec)     # token de convite em localStorage
      http/
        auth.interceptor.ts (+ .spec)           # injeta Bearer; 401 → /login
      api/
        api.service.ts (+ .spec)                # wrappers tipados dos 7 endpoints
      guards/
        auth.guard.ts (+ .spec)                 # exige sessão
        guest.guard.ts (+ .spec)                # exige NÃO logado
        onboarding.guard.ts (+ .spec)           # /me.tem_onboarding decide
    shared/ui/
      atoms/
        button/button.component.ts (+ .spec)
        text-input/text-input.component.ts (+ .spec)
        checkbox/checkbox.component.ts (+ .spec)
        spinner/spinner.component.ts (+ .spec)
        error-label/error-label.component.ts (+ .spec)
      molecules/
        field/field.component.ts (+ .spec)
        card/card.component.ts (+ .spec)
        stepper-item/stepper-item.component.ts (+ .spec)
      templates/
        public-layout/public-layout.component.ts (+ .spec)
```

---

### Task 1: Configuração do projeto (deps, environment, tsconfig path, HttpClient)

**Files:**
- Modify: `frontend/package.json` (dependência)
- Create: `frontend/src/environments/environment.ts`, `frontend/src/environments/environment.development.ts`
- Modify: `frontend/angular.json` (fileReplacements em build.production), `frontend/tsconfig.json` (paths)
- Modify: `frontend/src/app/app.config.ts` (provideHttpClient)

**Interfaces:**
- Produces: `environment` (`{ production: boolean; apiBaseUrl: string; supabaseUrl: string; supabaseAnonKey: string }`) importável de `../../environments/environment`; `@crescendo/shared` resolvível como tipo; `HttpClient` provido com o `authInterceptor` (registrado na Task 3 — aqui o array começa vazio e a Task 3 o preenche).

- [ ] **Step 1: Instalar o SDK do Supabase**

Run: `pnpm --filter frontend add @supabase/supabase-js`
Expected: instala sem erro; aparece em `frontend/package.json` `dependencies`.

- [ ] **Step 2: Criar os arquivos de environment**

Create `frontend/src/environments/environment.ts`:

```ts
export const environment = {
  production: true,
  apiBaseUrl: 'http://localhost:3000',
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'public-anon-key',
};
```

Create `frontend/src/environments/environment.development.ts`:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000',
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'public-anon-key',
};
```

> Nota: os valores reais de `supabaseUrl`/`supabaseAnonKey` e a `apiBaseUrl` de produção (Render) são preenchidos no deploy; aqui ficam placeholders válidos (sintaxe de URL correta) — o app dev fala com o backend local em `:3000`.

- [ ] **Step 3: Registrar o fileReplacement de development no `angular.json`**

Em `frontend/angular.json`, dentro de `projects.frontend.architect.build.configurations.development`, adicionar a chave `fileReplacements` (mantendo `optimization`/`extractLicenses`/`sourceMap` que já existem):

```json
"development": {
  "optimization": false,
  "extractLicenses": false,
  "sourceMap": true,
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.development.ts"
    }
  ]
}
```

- [ ] **Step 4: Mapear `@crescendo/shared` no `tsconfig.json`**

Em `frontend/tsconfig.json`, dentro de `compilerOptions`, adicionar:

```json
"baseUrl": ".",
"paths": {
  "@crescendo/shared": ["../shared/src/index.ts"]
}
```

- [ ] **Step 5: Prover o `HttpClient` no `app.config.ts`**

Modify `frontend/src/app/app.config.ts` (adicionar o `provideHttpClient`; o array de interceptors fica vazio agora e será preenchido na Task 3):

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
```

- [ ] **Step 6: Verificar build de desenvolvimento e tipos**

Run: `pnpm --filter frontend build --configuration development`
Expected: build conclui sem erro (o fileReplacement e o `provideHttpClient` compilam; `environment` resolve).

- [ ] **Step 7: Verificar que a suíte existente continua passando**

Run: `pnpm --filter frontend test`
Expected: os testes da F0 (`app.spec.ts`, `home.component.spec.ts`) seguem PASS.

- [ ] **Step 8: Commit**

```bash
git add frontend/package.json frontend/angular.json frontend/tsconfig.json frontend/src/environments frontend/src/app/app.config.ts pnpm-lock.yaml
git commit -m "feat(frontend): config base da F1 (Supabase dep, environments, path @crescendo/shared, HttpClient)"
```

---

### Task 2: Cliente Supabase + `AuthService`

**Files:**
- Create: `frontend/src/app/core/auth/supabase-client.ts`
- Create: `frontend/src/app/core/auth/auth.service.ts`
- Test: `frontend/src/app/core/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: `environment`, `@supabase/supabase-js`.
- Produces:
  - `SUPABASE_CLIENT` — `InjectionToken<SupabaseClient>` (factory `createClient`).
  - `AuthService` (`providedIn: 'root'`):
    - `session: Signal<Session | null>` (readonly), `isAuthenticated: Signal<boolean>` (computed).
    - `accessToken(): string | null`.
    - `signUp(nome: string, email: string, password: string): Promise<AuthResponse>` — passa `nome` em `options.data` e `emailRedirectTo`.
    - `signIn(email: string, password: string): Promise<AuthTokenResponsePassword>`.
    - `signOut(): Promise<void>`.
    - `updatePassword(password: string): Promise<UserResponse>`.

- [ ] **Step 1: Criar o token do cliente Supabase**

Create `frontend/src/app/core/auth/supabase-client.ts`:

```ts
import { InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SUPABASE_CLIENT', {
  providedIn: 'root',
  factory: () =>
    createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }),
});
```

- [ ] **Step 2: Escrever o teste do `AuthService` (que falha)**

Create `frontend/src/app/core/auth/auth.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { SUPABASE_CLIENT } from './supabase-client';

function fakeSupabase() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  };
}

describe('AuthService', () => {
  let supa: ReturnType<typeof fakeSupabase>;

  function make() {
    supa = fakeSupabase();
    TestBed.configureTestingModule({
      providers: [{ provide: SUPABASE_CLIENT, useValue: supa }],
    });
    return TestBed.inject(AuthService);
  }

  it('começa não autenticado quando não há sessão', () => {
    const svc = make();
    expect(svc.isAuthenticated()).toBe(false);
    expect(svc.accessToken()).toBeNull();
  });

  it('signUp envia nome em options.data', async () => {
    const svc = make();
    await svc.signUp('Ana', 'ana@ex.com', 'segredo123');
    expect(supa.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@ex.com',
        password: 'segredo123',
        options: expect.objectContaining({ data: { nome: 'Ana' } }),
      }),
    );
  });

  it('signIn chama signInWithPassword', async () => {
    const svc = make();
    await svc.signIn('ana@ex.com', 'segredo123');
    expect(supa.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'ana@ex.com', password: 'segredo123' });
  });

  it('updatePassword chama updateUser', async () => {
    const svc = make();
    await svc.updatePassword('novaSenha123');
    expect(supa.auth.updateUser).toHaveBeenCalledWith({ password: 'novaSenha123' });
  });

  it('reflete a sessão emitida pelo onAuthStateChange', () => {
    const svc = make();
    const cb = supa.auth.onAuthStateChange.mock.calls[0][0] as (e: string, s: unknown) => void;
    cb('SIGNED_IN', { access_token: 'jwt-123' });
    expect(svc.isAuthenticated()).toBe(true);
    expect(svc.accessToken()).toBe('jwt-123');
  });
});
```

- [ ] **Step 3: Rodar e confirmar falha**

Run: `pnpm --filter frontend test auth.service`
Expected: FAIL — `auth.service` não existe.

- [ ] **Step 4: Implementar o `AuthService`**

Create `frontend/src/app/core/auth/auth.service.ts`:

```ts
import { computed, inject, Injectable, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './supabase-client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly _session = signal<Session | null>(null);

  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);

  constructor() {
    void this.supabase.auth.getSession().then(({ data }) => this._session.set(data.session));
    this.supabase.auth.onAuthStateChange((_event, session) => this._session.set(session));
  }

  accessToken(): string | null {
    return this._session()?.access_token ?? null;
  }

  signUp(nome: string, email: string, password: string) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: { data: { nome }, emailRedirectTo: `${location.origin}/login` },
    });
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  updatePassword(password: string) {
    return this.supabase.auth.updateUser({ password });
  }
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test auth.service`
Expected: PASS (5 testes).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/core/auth/supabase-client.ts frontend/src/app/core/auth/auth.service.ts frontend/src/app/core/auth/auth.service.spec.ts
git commit -m "feat(frontend): AuthService encapsulando o SDK do Supabase (sessão por signal) — TDD"
```

---

### Task 3: Interceptor de JWT (Bearer + 401 → /login)

**Files:**
- Create: `frontend/src/app/core/http/auth.interceptor.ts`
- Test: `frontend/src/app/core/http/auth.interceptor.spec.ts`
- Modify: `frontend/src/app/app.config.ts` (registrar o interceptor)

**Interfaces:**
- Consumes: `AuthService.accessToken()`, `Router`.
- Produces: `authInterceptor: HttpInterceptorFn` — injeta `Authorization: Bearer <token>` quando há sessão; em resposta `401`, navega para `/login` e repropaga o erro.

- [ ] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/core/http/auth.interceptor.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../auth/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const navigate = vi.fn();

  function setup(token: string | null) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { accessToken: () => token } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  it('adiciona Authorization Bearer quando há token', () => {
    setup('jwt-abc');
    http.get('/me').subscribe();
    const req = httpMock.expectOne('/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-abc');
    req.flush({});
  });

  it('não adiciona header quando não há token', () => {
    setup(null);
    http.get('/municipios').subscribe();
    const req = httpMock.expectOne('/municipios');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('em 401 navega para /login', () => {
    navigate.mockClear();
    setup('jwt-abc');
    http.get('/me').subscribe({ error: () => {} });
    httpMock.expectOne('/me').flush('nao autorizado', { status: 401, statusText: 'Unauthorized' });
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  afterEach(() => httpMock.verify());
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test auth.interceptor`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar o interceptor**

Create `frontend/src/app/core/http/auth.interceptor.ts`:

```ts
import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.accessToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        void router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test auth.interceptor`
Expected: PASS (3 testes).

- [ ] **Step 5: Registrar o interceptor no `app.config.ts`**

Em `frontend/src/app/app.config.ts`, importar e incluir no array:

```ts
import { authInterceptor } from './core/http/auth.interceptor';
```

Trocar `withInterceptors([])` por `withInterceptors([authInterceptor])`.

- [ ] **Step 6: Verificar build + commit**

Run: `pnpm --filter frontend build --configuration development`
Expected: build OK.

```bash
git add frontend/src/app/core/http frontend/src/app/app.config.ts
git commit -m "feat(frontend): interceptor injeta JWT e trata 401 → /login (TDD)"
```

---

### Task 4: `ApiService` (wrappers tipados dos 7 endpoints)

**Files:**
- Create: `frontend/src/app/core/api/api.service.ts`
- Test: `frontend/src/app/core/api/api.service.spec.ts`

**Interfaces:**
- Consumes: `HttpClient`, `environment.apiBaseUrl`, tipos de `@crescendo/shared`.
- Produces: `ApiService` (`providedIn: 'root'`) com:
  - `getMe(): Observable<MeResponse>` → `GET {base}/me`
  - `listarMunicipios(): Observable<MunicipioResponse[]>` → `GET {base}/municipios`
  - `onboardingGestante(body: OnboardingGestanteRequest): Observable<OnboardingGestanteResponse>` → `POST {base}/onboarding/gestante`
  - `gerarConvite(body: GerarConviteRequest): Observable<ConviteResponse>` → `POST {base}/convites`
  - `consultarConvite(token: string): Observable<ConsultarConviteResponse>` → `GET {base}/convites/:token`
  - `aceitarConvite(token: string): Observable<AceitarConviteResponse>` → `POST {base}/convites/:token/aceitar`
  - `esqueciSenha(body: EsqueciSenhaRequest): Observable<void>` → `POST {base}/auth/esqueci-senha`

- [ ] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/core/api/api.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';

const BASE = 'http://localhost:3000';

describe('ApiService', () => {
  let api: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getMe faz GET /me', () => {
    api.getMe().subscribe();
    const req = httpMock.expectOne(`${BASE}/me`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('listarMunicipios faz GET /municipios', () => {
    api.listarMunicipios().subscribe();
    const req = httpMock.expectOne(`${BASE}/municipios`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('onboardingGestante faz POST /onboarding/gestante com o corpo', () => {
    const body = { perfil: { nome: 'Ana', data_nascimento: '1995-05-05', municipio_id: 1, aceite_termos: true, versao_termos: 'v1' }, gestacao: { semanas: 10 } };
    api.onboardingGestante(body as never).subscribe();
    const req = httpMock.expectOne(`${BASE}/onboarding/gestante`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ gestacao_id: 1, convites: [] });
  });

  it('gerarConvite faz POST /convites', () => {
    api.gerarConvite({ papel: 'parceiro' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/convites`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ papel: 'parceiro' });
    req.flush({ token: 't', papel: 'parceiro', expira_em: '', url_relativa: '/convite/t' });
  });

  it('consultarConvite faz GET /convites/:token', () => {
    api.consultarConvite('tok123').subscribe();
    const req = httpMock.expectOne(`${BASE}/convites/tok123`);
    expect(req.request.method).toBe('GET');
    req.flush({ papel: 'parceiro', nome_gestante: 'Ana' });
  });

  it('aceitarConvite faz POST /convites/:token/aceitar', () => {
    api.aceitarConvite('tok123').subscribe();
    const req = httpMock.expectOne(`${BASE}/convites/tok123/aceitar`);
    expect(req.request.method).toBe('POST');
    req.flush({ gestacao_id: 9, papel: 'parceiro' });
  });

  it('esqueciSenha faz POST /auth/esqueci-senha', () => {
    api.esqueciSenha({ email: 'ana@ex.com' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/auth/esqueci-senha`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ana@ex.com' });
    req.flush(null);
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test api.service`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar o `ApiService`**

Create `frontend/src/app/core/api/api.service.ts`:

```ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  MeResponse,
  MunicipioResponse,
  OnboardingGestanteRequest,
  OnboardingGestanteResponse,
  GerarConviteRequest,
  ConviteResponse,
  ConsultarConviteResponse,
  AceitarConviteResponse,
  EsqueciSenhaRequest,
} from '@crescendo/shared';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.base}/me`);
  }

  listarMunicipios(): Observable<MunicipioResponse[]> {
    return this.http.get<MunicipioResponse[]>(`${this.base}/municipios`);
  }

  onboardingGestante(body: OnboardingGestanteRequest): Observable<OnboardingGestanteResponse> {
    return this.http.post<OnboardingGestanteResponse>(`${this.base}/onboarding/gestante`, body);
  }

  gerarConvite(body: GerarConviteRequest): Observable<ConviteResponse> {
    return this.http.post<ConviteResponse>(`${this.base}/convites`, body);
  }

  consultarConvite(token: string): Observable<ConsultarConviteResponse> {
    return this.http.get<ConsultarConviteResponse>(`${this.base}/convites/${token}`);
  }

  aceitarConvite(token: string): Observable<AceitarConviteResponse> {
    return this.http.post<AceitarConviteResponse>(`${this.base}/convites/${token}/aceitar`, {});
  }

  esqueciSenha(body: EsqueciSenhaRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/esqueci-senha`, body);
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test api.service`
Expected: PASS (7 testes).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/core/api
git commit -m "feat(frontend): ApiService tipado com os 7 endpoints da F1 (TDD)"
```

---

### Task 5: `PendingInviteService` (token de convite em localStorage)

**Files:**
- Create: `frontend/src/app/core/auth/pending-invite.service.ts`
- Test: `frontend/src/app/core/auth/pending-invite.service.spec.ts`

**Interfaces:**
- Produces: `PendingInviteService` (`providedIn: 'root'`): `set(token: string): void`; `get(): string | null`; `clear(): void`. Persiste em `localStorage` na chave `cj_pending_invite`.

- [ ] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/core/auth/pending-invite.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { PendingInviteService } from './pending-invite.service';

describe('PendingInviteService', () => {
  let svc: PendingInviteService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(PendingInviteService);
  });

  it('get retorna null quando não há token', () => {
    expect(svc.get()).toBeNull();
  });

  it('set persiste e get recupera', () => {
    svc.set('tok-123');
    expect(svc.get()).toBe('tok-123');
    expect(localStorage.getItem('cj_pending_invite')).toBe('tok-123');
  });

  it('clear remove o token', () => {
    svc.set('tok-123');
    svc.clear();
    expect(svc.get()).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test pending-invite`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

Create `frontend/src/app/core/auth/pending-invite.service.ts`:

```ts
import { Injectable } from '@angular/core';

const KEY = 'cj_pending_invite';

@Injectable({ providedIn: 'root' })
export class PendingInviteService {
  set(token: string): void {
    localStorage.setItem(KEY, token);
  }

  get(): string | null {
    return localStorage.getItem(KEY);
  }

  clear(): void {
    localStorage.removeItem(KEY);
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test pending-invite`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/core/auth/pending-invite.service.ts frontend/src/app/core/auth/pending-invite.service.spec.ts
git commit -m "feat(frontend): PendingInviteService (token de convite em localStorage) — TDD"
```

---

### Task 6: Guards (`authGuard`, `guestGuard`, `onboardingGuard`)

**Files:**
- Create: `frontend/src/app/core/guards/auth.guard.ts`, `frontend/src/app/core/guards/guest.guard.ts`, `frontend/src/app/core/guards/onboarding.guard.ts`
- Test: `frontend/src/app/core/guards/guards.spec.ts`

**Interfaces:**
- Consumes: `AuthService.isAuthenticated()`, `ApiService.getMe()`, `Router`.
- Produces:
  - `authGuard: CanActivateFn` — `true` se autenticado; senão `UrlTree` para `/login`.
  - `guestGuard: CanActivateFn` — `true` se **não** autenticado; senão `UrlTree` para `/`.
  - `onboardingGuard: CanActivateFn` — consulta `GET /me`; se `tem_onboarding` → `UrlTree` para `/` (já onboarded, não entra no wizard); senão `true`. Em erro de `/me`, libera (`true`) para o wizard tratar.

- [ ] **Step 1: Escrever os testes (que falham)**

Create `frontend/src/app/core/guards/guards.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { onboardingGuard } from './onboarding.guard';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';

function urlTreeFor(path: string): UrlTree {
  return TestBed.inject(Router).parseUrl(path);
}

describe('guards', () => {
  function setup(opts: { authed?: boolean; me?: unknown; meError?: boolean } = {}) {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => opts.authed ?? false } },
        {
          provide: ApiService,
          useValue: {
            getMe: () => (opts.meError ? throwError(() => new Error('x')) : of(opts.me ?? { tem_onboarding: false })),
          },
        },
      ],
    });
  }

  const run = <T>(g: () => T): T => TestBed.runInInjectionContext(g as never);
  const route = {} as never;
  const state = { url: '/x' } as never;

  it('authGuard: libera autenticado', () => {
    setup({ authed: true });
    expect(run(() => authGuard(route, state))).toBe(true);
  });

  it('authGuard: redireciona não autenticado para /login', () => {
    setup({ authed: false });
    const res = run(() => authGuard(route, state)) as UrlTree;
    expect(res.toString()).toBe(urlTreeFor('/login').toString());
  });

  it('guestGuard: libera não autenticado', () => {
    setup({ authed: false });
    expect(run(() => guestGuard(route, state))).toBe(true);
  });

  it('guestGuard: redireciona autenticado para /', () => {
    setup({ authed: true });
    const res = run(() => guestGuard(route, state)) as UrlTree;
    expect(res.toString()).toBe(urlTreeFor('/').toString());
  });

  it('onboardingGuard: tem_onboarding=true → redireciona para /', (done) => {
    setup({ authed: true, me: { tem_onboarding: true } });
    (run(() => onboardingGuard(route, state)) as import('rxjs').Observable<boolean | UrlTree>).subscribe((r) => {
      expect((r as UrlTree).toString()).toBe(urlTreeFor('/').toString());
      done();
    });
  });

  it('onboardingGuard: tem_onboarding=false → libera', (done) => {
    setup({ authed: true, me: { tem_onboarding: false } });
    (run(() => onboardingGuard(route, state)) as import('rxjs').Observable<boolean | UrlTree>).subscribe((r) => {
      expect(r).toBe(true);
      done();
    });
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test guards`
Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: Implementar os guards**

Create `frontend/src/app/core/guards/auth.guard.ts`:

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.parseUrl('/login');
};
```

Create `frontend/src/app/core/guards/guest.guard.ts`:

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.parseUrl('/') : true;
};
```

Create `frontend/src/app/core/guards/onboarding.guard.ts`:

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ApiService } from '../api/api.service';

export const onboardingGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  return api.getMe().pipe(
    map((me) => (me.tem_onboarding ? router.parseUrl('/') : true)),
    catchError(() => of(true)),
  );
};
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test guards`
Expected: PASS (6 testes).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/core/guards
git commit -m "feat(frontend): authGuard/guestGuard/onboardingGuard (TDD)"
```

---

### Task 7: UI atômica — atoms

**Files:**
- Create: `frontend/src/app/shared/ui/atoms/button/button.component.ts`, `.../text-input/text-input.component.ts`, `.../checkbox/checkbox.component.ts`, `.../spinner/spinner.component.ts`, `.../error-label/error-label.component.ts`
- Test: `.../button/button.component.spec.ts`, `.../text-input/text-input.component.spec.ts`

**Interfaces:**
- Produces (todos standalone, `selector` com prefixo `ui-`, apresentação pura):
  - `ButtonComponent` (`ui-button`): inputs `type: 'button'|'submit'` (default `'button'`), `disabled: boolean`, `loading: boolean`; projeta conteúdo; quando `loading` mostra o `SpinnerComponent` e fica `disabled`.
  - `TextInputComponent` (`ui-text-input`): inputs `type` (default `'text'`), `placeholder`, `value` (model signal), `id`; output implícito via `value` (two-way `[(value)]`).
  - `CheckboxComponent` (`ui-checkbox`): `checked` (model), projeta label.
  - `SpinnerComponent` (`ui-spinner`): visual puro.
  - `ErrorLabelComponent` (`ui-error-label`): input `message: string | null`; renderiza só quando há mensagem, com `role="alert"`.

- [ ] **Step 1: Implementar `SpinnerComponent` e `ErrorLabelComponent` (sem teste dedicado — triviais, exercitados via button/field)**

Create `frontend/src/app/shared/ui/atoms/spinner/spinner.component.ts`:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="spinner" aria-hidden="true"></span>`,
  styles: `.spinner{display:inline-block;width:1em;height:1em;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin .6s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`,
})
export class SpinnerComponent {}
```

Create `frontend/src/app/shared/ui/atoms/error-label/error-label.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-error-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (message()) {<span class="erro" role="alert">{{ message() }}</span>}`,
  styles: `.erro{color:#c0392b;font-size:.85rem}`,
})
export class ErrorLabelComponent {
  readonly message = input<string | null>(null);
}
```

- [ ] **Step 2: Escrever o teste do `ButtonComponent` (que falha)**

Create `frontend/src/app/shared/ui/atoms/button/button.component.spec.ts`:

```ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<ui-button [loading]="loading" [disabled]="disabled">Enviar</ui-button>`,
})
class Host {
  loading = false;
  disabled = false;
}

describe('ButtonComponent', () => {
  it('projeta o conteúdo', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).textContent).toContain('Enviar');
  });

  it('fica disabled quando loading', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    f.componentInstance.loading = true;
    f.detectChanges();
    const btn = (f.nativeElement as HTMLElement).querySelector('button')!;
    expect(btn.disabled).toBe(true);
    expect((f.nativeElement as HTMLElement).querySelector('ui-spinner')).not.toBeNull();
  });
});
```

- [ ] **Step 3: Rodar e confirmar falha**

Run: `pnpm --filter frontend test button.component`
Expected: FAIL — módulo inexistente.

- [ ] **Step 4: Implementar `ButtonComponent`**

Create `frontend/src/app/shared/ui/atoms/button/button.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button [type]="type()" [disabled]="disabled() || loading()" class="btn">
      @if (loading()) {<ui-spinner />} <ng-content />
    </button>
  `,
  styles: `.btn{display:inline-flex;align-items:center;gap:.4rem;padding:.6rem 1rem;border:none;border-radius:.5rem;background:#5DBB8A;color:#fff;font-weight:600;cursor:pointer}.btn:disabled{opacity:.6;cursor:not-allowed}`,
})
export class ButtonComponent {
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test button.component`
Expected: PASS (2 testes).

- [ ] **Step 6: Implementar `TextInputComponent` + teste**

Create `frontend/src/app/shared/ui/atoms/text-input/text-input.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'ui-text-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      [id]="id()"
      [type]="type()"
      [placeholder]="placeholder()"
      [value]="value()"
      (input)="value.set($any($event.target).value)"
      class="inp"
    />
  `,
  styles: `.inp{width:100%;padding:.6rem .75rem;border:1px solid #cbd5e1;border-radius:.5rem;font-size:1rem}`,
})
export class TextInputComponent {
  readonly id = input<string>('');
  readonly type = input<string>('text');
  readonly placeholder = input<string>('');
  readonly value = model<string>('');
}
```

Create `frontend/src/app/shared/ui/atoms/text-input/text-input.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { TextInputComponent } from './text-input.component';

describe('TextInputComponent', () => {
  it('atualiza o model ao digitar', async () => {
    await TestBed.configureTestingModule({ imports: [TextInputComponent] }).compileComponents();
    const f = TestBed.createComponent(TextInputComponent);
    f.detectChanges();
    const input = (f.nativeElement as HTMLElement).querySelector('input')!;
    input.value = 'ana@ex.com';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('ana@ex.com');
  });
});
```

- [ ] **Step 7: Implementar `CheckboxComponent`**

Create `frontend/src/app/shared/ui/atoms/checkbox/checkbox.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="chk">
      <input type="checkbox" [id]="id()" [checked]="checked()" (change)="checked.set($any($event.target).checked)" />
      <ng-content />
    </label>
  `,
  styles: `.chk{display:flex;align-items:center;gap:.5rem;font-size:.95rem}`,
})
export class CheckboxComponent {
  readonly id = input<string>('');
  readonly checked = model<boolean>(false);
}
```

- [ ] **Step 8: Rodar a suíte de atoms e commitar**

Run: `pnpm --filter frontend test text-input.component button.component`
Expected: PASS.

```bash
git add frontend/src/app/shared/ui/atoms
git commit -m "feat(frontend): atoms da UI (button, text-input, checkbox, spinner, error-label) — TDD"
```

---

### Task 8: UI atômica — molecules e template

**Files:**
- Create: `frontend/src/app/shared/ui/molecules/field/field.component.ts`, `.../card/card.component.ts`, `.../stepper-item/stepper-item.component.ts`
- Create: `frontend/src/app/shared/ui/templates/public-layout/public-layout.component.ts`
- Test: `.../field/field.component.spec.ts`

**Interfaces:**
- Consumes: `TextInputComponent`, `ErrorLabelComponent`.
- Produces (standalone):
  - `FieldComponent` (`ui-field`): inputs `label`, `for` (id), `error: string | null`; projeta o controle (input/checkbox) via `<ng-content>`; renderiza `<label>` + conteúdo + `ui-error-label`.
  - `CardComponent` (`ui-card`): container com sombra; projeta conteúdo.
  - `StepperItemComponent` (`ui-stepper-item`): inputs `index: number`, `active: boolean`, `done: boolean`; mostra o número/estado do passo.
  - `PublicLayoutComponent` (`ui-public-layout`): layout centralizado para telas públicas; projeta um `ui-card` com o conteúdo.

- [ ] **Step 1: Escrever o teste do `FieldComponent` (que falha)**

Create `frontend/src/app/shared/ui/molecules/field/field.component.spec.ts`:

```ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FieldComponent } from './field.component';

@Component({
  standalone: true,
  imports: [FieldComponent],
  template: `<ui-field label="E-mail" [error]="error"><input id="email" /></ui-field>`,
})
class Host {
  error: string | null = null;
}

describe('FieldComponent', () => {
  it('renderiza o label e projeta o controle', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('label')!.textContent).toContain('E-mail');
    expect(el.querySelector('input#email')).not.toBeNull();
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  it('mostra o erro quando presente', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    f.componentInstance.error = 'Campo obrigatório';
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).querySelector('[role="alert"]')!.textContent).toContain('Campo obrigatório');
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test field.component`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar `FieldComponent`**

Create `frontend/src/app/shared/ui/molecules/field/field.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ErrorLabelComponent } from '../../atoms/error-label/error-label.component';

@Component({
  selector: 'ui-field',
  standalone: true,
  imports: [ErrorLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      <label [attr.for]="for()">{{ label() }}</label>
      <ng-content />
      <ui-error-label [message]="error()" />
    </div>
  `,
  styles: `.field{display:flex;flex-direction:column;gap:.35rem;margin-bottom:1rem}label{font-size:.9rem;font-weight:600;color:#334155}`,
})
export class FieldComponent {
  readonly label = input<string>('');
  readonly for = input<string>('');
  readonly error = input<string | null>(null);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test field.component`
Expected: PASS (2 testes).

- [ ] **Step 5: Implementar `CardComponent`, `StepperItemComponent` e `PublicLayoutComponent`**

Create `frontend/src/app/shared/ui/molecules/card/card.component.ts`:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="card"><ng-content /></div>`,
  styles: `.card{background:#fff;border-radius:1rem;box-shadow:0 4px 20px rgba(0,0,0,.08);padding:2rem}`,
})
export class CardComponent {}
```

Create `frontend/src/app/shared/ui/molecules/stepper-item/stepper-item.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-stepper-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="step" [class.active]="active()" [class.done]="done()">
      {{ done() ? '✓' : index() }}
    </span>
  `,
  styles: `.step{display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:50%;background:#e2e8f0;color:#475569;font-weight:700}.active{background:#5DBB8A;color:#fff}.done{background:#2f855a;color:#fff}`,
})
export class StepperItemComponent {
  readonly index = input<number>(1);
  readonly active = input<boolean>(false);
  readonly done = input<boolean>(false);
}
```

Create `frontend/src/app/shared/ui/templates/public-layout/public-layout.component.ts`:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent } from '../../molecules/card/card.component';

@Component({
  selector: 'ui-public-layout',
  standalone: true,
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="wrap">
      <ui-card><ng-content /></ui-card>
    </main>
  `,
  styles: `.wrap{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:#f1f5f9}ui-card{width:100%;max-width:26rem}`,
})
export class PublicLayoutComponent {}
```

- [ ] **Step 6: Verificar build de produção (garante que os componentes compilam e os budgets de estilo passam) + suíte completa**

Run: `pnpm --filter frontend build`
Expected: build de produção conclui sem erro (estilos de componente abaixo do budget de 4kB).
Run: `pnpm --filter frontend test`
Expected: toda a suíte do frontend PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/shared/ui/molecules frontend/src/app/shared/ui/templates
git commit -m "feat(frontend): molecules (field, card, stepper-item) e template public-layout — TDD"
```

---

## Self-Review

**Spec coverage (parte de fundação do frontend, spec seção 4):**
- `core/auth` (AuthService wrapping Supabase, sessão como signal, signUp com nome em user_metadata) → Tasks 2 ✅
- `core/http` (interceptor injeta JWT, 401 → /login) → Task 3 ✅
- `core/guards` (authGuard, onboardingGuard via /me.tem_onboarding, guestGuard) → Task 6 ✅
- Token de convite pendente em localStorage (F1-17) → Task 5 (`PendingInviteService`) ✅
- `@supabase/supabase-js` + `environment` (SUPABASE_URL/anon key, apiBaseUrl) → Task 1 ✅
- Consumo dos 7 endpoints da F1a → Task 4 (`ApiService`) ✅
- Atomic Design só em `shared/ui` (atoms/molecules/templates) → Tasks 7–8 ✅; `organisms` (formulários de login/cadastro/passo do wizard) ficam para o F1b-2, junto das telas que os compõem.
- Vitest (não Karma; F1-13) → todos os testes ✅

**Fora de escopo (F1b-2, telas):** rotas (`/login`, `/cadastro`, `/termos`, `/esqueci-senha`, `/redefinir-senha`, `/confirmar-email`, `/convite/:token`, `/onboarding`, `/`), organisms/forms com signal-forms, o wizard de 3 passos, a reidratação do token de convite pós-login, e o `app.routes.ts` final. Esta fundação entrega tudo que essas telas consomem.

**Placeholder scan:** sem TBD/TODO; cada step traz código/comando concreto. ✅

**Type consistency:** `AuthService.accessToken()` (Task 2) é consumido pelo interceptor (Task 3); `ApiService.getMe()` (Task 4) é consumido pelo `onboardingGuard` (Task 6); `SpinnerComponent` (Task 7) é usado por `ButtonComponent` (Task 7); `ErrorLabelComponent` (Task 7) por `FieldComponent` (Task 8); `CardComponent` (Task 8) por `PublicLayoutComponent` (Task 8); tipos de `@crescendo/shared` importados com `import type` em todo o `ApiService`. ✅

**Notas conscientes (não são placeholders):**
- `environment.supabaseUrl/anonKey` e `apiBaseUrl` de produção são placeholders válidos; o provisionamento real do projeto Supabase + Redirect URLs é operacional (spec seção 7) e independe deste código.
- `esqueci-senha` é roteado pelo backend (`ApiService.esqueciSenha` → F1a), fiel ao spec; o `AuthService.updatePassword` cobre a definição de nova senha na sessão de recuperação (tela `redefinir-senha`, F1b-2).
- O builder `@angular/build:unit-test` (Vitest) já estava configurado na F0; os specs usam os globals do Vitest (`vi`, `describe`, `it`, `expect`) como o `home.component.spec.ts` existente.

---

## Execution Handoff

**Plano completo e salvo em `docs/superpowers/plans/2026-06-22-f1b1-frontend-fundacao.md`. Duas opções de execução:**

**1. Subagent-Driven (recomendado)** — disparo um subagente novo por task, revisão em dois estágios entre tasks.

**2. Inline Execution** — executo as tasks nesta sessão com checkpoints.

**Qual abordagem?** (Após o F1b-1, escrevo o F1b-2 — as telas.)
