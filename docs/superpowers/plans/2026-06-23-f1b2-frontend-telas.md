# F1b-2 — Frontend Telas (Angular 22 PWA) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar as 9 telas da F1 (login, cadastro, termos, esqueci-senha, redefinir-senha, confirmar-email, convite, onboarding wizard de 3 passos e home) sobre a fundação já pronta (F1b-1), com **Signal Forms** (`@angular/forms/signals`), rotas lazy por feature, guards aplicados e o fluxo de convite pendente reidratado pós-login — tudo testado em Vitest.

**Architecture:** `features/` segue a Scope Rule (organização por domínio); `shared/ui/organisms` ganha os formulários reaproveitáveis (login, cadastro, passos do wizard) como **componentes de apresentação que possuem o `form()` e emitem o valor tipado via `output`**; os componentes de rota em `features/` são **smart** — recebem o valor emitido, chamam `AuthService`/`ApiService`, gerenciam `loading`/erro por signal e navegam. Os atoms `ui-text-input`/`ui-checkbox` passam a implementar os contratos `FormValueControl`/`FormCheckboxControl` para casar com a diretiva `[formField]`.

**Tech Stack:** Angular 22 (standalone, signals, **Signal Forms** `@angular/forms/signals`, functional guards, lazy `loadComponent`) · `@supabase/supabase-js` v2 (via `AuthService`) · Vitest + jsdom · TypeScript 6 · pnpm 10.

## Global Constraints

- **Node 22+** (ambiente: Node 24). **pnpm 10** (gerenciador único).
- **Angular 22 moderno:** standalone, **signals**, `inject()`, functional guards, lazy routes. Sem NgModules.
- **Signal Forms (developer preview):** importar **só** de `@angular/forms/signals`. API desta release (22.0.2): `form(model, schemaFn)`, `schema(fn)`, validadores `required`/`email`/`minLength`/`pattern`/`validate`, `submit(form, action)`; diretiva de binding **`FormField`** com selector **`[formField]`**; estado do campo via `f.campo()` → `.value()`, `.errors()` (array de `{ kind, message? }`), `.touched()`, `.valid()`, `.invalid()`, `.submitting()`.
- **Atomic Design só em `shared/ui`** (atoms/molecules/organisms/templates). `core/` e `features/` seguem a Scope Rule.
- **Supabase encapsulado:** telas só falam com `AuthService` e `ApiService` (nunca com o SDK direto).
- **Contratos compartilhados:** importar de `@crescendo/shared` com `import type`.
- **TDD**; um commit por task no mínimo. Testes: `pnpm --filter frontend test [padrão]`. Build: `pnpm --filter frontend build`.
- **Cores/estilo:** seguir o padrão dos atoms da F1b-1 (verde `#5DBB8A`, cinzas `#334155`/`#cbd5e1`). Estilos de componente abaixo do budget de 4 kB.
- **Backend (F1a) entrega** os 7 endpoints já consumidos pelo `ApiService`. `AuthService` expõe `signUp(nome,email,password)`, `signIn(email,password)`, `signOut()`, `updatePassword(password)`, `session`/`isAuthenticated` (signals), `accessToken()`.

---

## File Structure

```
frontend/src/app/
  shared/ui/
    forms/
      field-error.ts                                   # (create) helper fieldError(field) → string|null
    atoms/
      text-input/text-input.component.ts               # (modify) implements FormValueControl<string>
      checkbox/checkbox.component.ts                    # (modify) implements FormCheckboxControl
    organisms/
      login-form/login-form.component.ts (+ .spec)      # (create) signal form email+senha
      cadastro-form/cadastro-form.component.ts (+ .spec) # (create) nome/email/senha/confirmar/aceite
      perfil-step/perfil-step.component.ts (+ .spec)     # (create) wizard passo 1
      gestacao-step/gestacao-step.component.ts (+ .spec) # (create) wizard passo 2
      convidar-step/convidar-step.component.ts (+ .spec) # (create) wizard passo 3
  core/
    convite/
      pending-invite-flow.service.ts (+ .spec)         # (create) consome convite pendente pós-login
  features/
    auth/
      login/login.component.ts (+ .spec)               # (create) smart
      cadastro/cadastro.component.ts (+ .spec)         # (create) smart
      termos/termos.component.ts                       # (create) estática
      confirmar-email/confirmar-email.component.ts     # (create) estática
      esqueci-senha/esqueci-senha.component.ts (+ .spec) # (create) smart
      redefinir-senha/redefinir-senha.component.ts (+ .spec) # (create) smart
    convite/
      convite.component.ts (+ .spec)                   # (create) /convite/:token
    onboarding/
      onboarding.component.ts (+ .spec)                # (create) wizard container
    home/
      home.component.ts (+ .spec)                      # (modify) decide via /me + consome convite
  app.routes.ts                                        # (modify) rotas lazy + guards
```

---

### Task 1: Atoms compatíveis com Signal Forms + helper de erro (+ smoke test da diretiva)

De-risca a API developer-preview: prova que `[formField]` casa com os atoms da F1b-1 antes de construir qualquer tela.

**Files:**
- Modify: `frontend/src/app/shared/ui/atoms/text-input/text-input.component.ts`
- Modify: `frontend/src/app/shared/ui/atoms/checkbox/checkbox.component.ts`
- Create: `frontend/src/app/shared/ui/forms/field-error.ts`
- Test: `frontend/src/app/shared/ui/forms/signal-forms-smoke.spec.ts`

**Interfaces:**
- Produces:
  - `TextInputComponent implements FormValueControl<string>` — mantém `value = model<string>('')`; agora bindável por `[formField]`.
  - `CheckboxComponent implements FormCheckboxControl` — mantém `checked = model<boolean>(false)`; bindável por `[formField]`.
  - `fieldError(field: () => FieldState<any>): string | null` — retorna a 1ª mensagem de erro **só quando o campo foi `touched`**, senão `null`.

- [x] **Step 1: Escrever o smoke test (que falha)**

Create `frontend/src/app/shared/ui/forms/signal-forms-smoke.spec.ts`:

```ts
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, required, FormField } from '@angular/forms/signals';
import { TextInputComponent } from '../atoms/text-input/text-input.component';
import { fieldError } from './field-error';

@Component({
  standalone: true,
  imports: [TextInputComponent, FormField],
  template: `
    <ui-text-input [formField]="f.nome" id="nome" />
    <span class="err">{{ fieldError(f.nome) }}</span>
  `,
})
class Host {
  protected readonly model = signal({ nome: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.nome, { message: 'Obrigatório' });
  });
  protected readonly fieldError = fieldError;
}

describe('Signal Forms ↔ atoms (smoke)', () => {
  it('digitar no ui-text-input atualiza o valor do form', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fx = TestBed.createComponent(Host);
    fx.detectChanges();
    const input = (fx.nativeElement as HTMLElement).querySelector('input')!;
    input.value = 'Ana';
    input.dispatchEvent(new Event('input'));
    fx.detectChanges();
    expect((fx.componentInstance as never as { model: () => { nome: string } }).model().nome).toBe('Ana');
  });

  it('fieldError só aparece após touched (blur)', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fx = TestBed.createComponent(Host);
    fx.detectChanges();
    expect((fx.nativeElement as HTMLElement).querySelector('.err')!.textContent!.trim()).toBe('');
    const input = (fx.nativeElement as HTMLElement).querySelector('input')!;
    input.dispatchEvent(new Event('blur'));
    fx.detectChanges();
    expect((fx.nativeElement as HTMLElement).querySelector('.err')!.textContent).toContain('Obrigatório');
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test signal-forms-smoke`
Expected: FAIL — `./field-error` não existe e/ou os atoms ainda não casam com `[formField]`.

- [x] **Step 3: Criar o helper `fieldError`**

Create `frontend/src/app/shared/ui/forms/field-error.ts`:

```ts
import type { FieldState } from '@angular/forms/signals';

/** Primeira mensagem de erro do campo, só quando já foi tocado; senão null. */
export function fieldError(field: () => FieldState<any>): string | null {
  const state = field();
  if (!state.touched()) return null;
  const errors = state.errors();
  return errors.length ? (errors[0].message ?? 'Valor inválido') : null;
}
```

- [x] **Step 4: Marcar `TextInputComponent` como `FormValueControl`**

Modify `frontend/src/app/shared/ui/atoms/text-input/text-input.component.ts` — adicionar o import do tipo e a cláusula `implements` (sem mudar o corpo, que já tem `value = model<string>('')`):

```ts
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
```

e a assinatura da classe:

```ts
export class TextInputComponent implements FormValueControl<string> {
```

- [x] **Step 5: Marcar `CheckboxComponent` como `FormCheckboxControl`**

Modify `frontend/src/app/shared/ui/atoms/checkbox/checkbox.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import type { FormCheckboxControl } from '@angular/forms/signals';
```

e:

```ts
export class CheckboxComponent implements FormCheckboxControl {
```

- [x] **Step 6: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test signal-forms-smoke`
Expected: PASS (2 testes). Confirma binding `[formField]` ↔ atoms e o helper `fieldError`.

- [x] **Step 7: Garantir a suíte existente intacta + commit**

Run: `pnpm --filter frontend test`
Expected: toda a suíte PASS (smoke novo incluído).

```bash
git add frontend/src/app/shared/ui/forms frontend/src/app/shared/ui/atoms/text-input frontend/src/app/shared/ui/atoms/checkbox
git commit -m "feat(frontend): atoms compatíveis com Signal Forms (FormValueControl/FormCheckboxControl) + fieldError — TDD"
```

---

### Task 2: `PendingInviteFlowService` (consome convite pendente)

**Files:**
- Create: `frontend/src/app/core/convite/pending-invite-flow.service.ts`
- Test: `frontend/src/app/core/convite/pending-invite-flow.service.spec.ts`

**Interfaces:**
- Consumes: `PendingInviteService` (`get`/`clear`), `ApiService.aceitarConvite(token)`.
- Produces: `PendingInviteFlowService` (`providedIn: 'root'`) com `consumir(): Observable<boolean>` — se não há token pendente, emite `false`; se há, chama `aceitarConvite`, **limpa o localStorage** (sucesso **ou** erro) e emite `true`/`false`.

- [x] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/core/convite/pending-invite-flow.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PendingInviteFlowService } from './pending-invite-flow.service';
import { PendingInviteService } from '../auth/pending-invite.service';
import { ApiService } from '../api/api.service';

describe('PendingInviteFlowService', () => {
  const aceitarConvite = vi.fn();
  const clear = vi.fn();
  let get: () => string | null;

  function setup(token: string | null, ok = true) {
    get = () => token;
    aceitarConvite.mockReturnValue(ok ? of({ gestacao_id: 1, papel: 'parceiro' }) : throwError(() => new Error('x')));
    TestBed.configureTestingModule({
      providers: [
        { provide: PendingInviteService, useValue: { get: () => get(), clear } },
        { provide: ApiService, useValue: { aceitarConvite } },
      ],
    });
    return TestBed.inject(PendingInviteFlowService);
  }

  beforeEach(() => {
    aceitarConvite.mockClear();
    clear.mockClear();
  });

  it('sem token pendente: emite false e não chama a API', (done) => {
    const svc = setup(null);
    svc.consumir().subscribe((r) => {
      expect(r).toBe(false);
      expect(aceitarConvite).not.toHaveBeenCalled();
      done();
    });
  });

  it('com token: aceita, limpa e emite true', (done) => {
    const svc = setup('tok-9');
    svc.consumir().subscribe((r) => {
      expect(aceitarConvite).toHaveBeenCalledWith('tok-9');
      expect(clear).toHaveBeenCalled();
      expect(r).toBe(true);
      done();
    });
  });

  it('erro ao aceitar: limpa mesmo assim e emite false', (done) => {
    const svc = setup('tok-9', false);
    svc.consumir().subscribe((r) => {
      expect(clear).toHaveBeenCalled();
      expect(r).toBe(false);
      done();
    });
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test pending-invite-flow`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar**

Create `frontend/src/app/core/convite/pending-invite-flow.service.ts`:

```ts
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import { PendingInviteService } from '../auth/pending-invite.service';

@Injectable({ providedIn: 'root' })
export class PendingInviteFlowService {
  private readonly api = inject(ApiService);
  private readonly pending = inject(PendingInviteService);

  /** Reidrata o token de convite (localStorage) e o consome; limpa em qualquer desfecho. */
  consumir(): Observable<boolean> {
    const token = this.pending.get();
    if (!token) return of(false);
    return this.api.aceitarConvite(token).pipe(
      tap(() => this.pending.clear()),
      map(() => true),
      catchError(() => {
        this.pending.clear();
        return of(false);
      }),
    );
  }
}
```

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test pending-invite-flow`
Expected: PASS (3 testes).

- [x] **Step 5: Commit**

```bash
git add frontend/src/app/core/convite
git commit -m "feat(frontend): PendingInviteFlowService consome o convite pendente pós-login (TDD)"
```

---

### Task 3: `LoginFormComponent` (organism)

**Files:**
- Create: `frontend/src/app/shared/ui/organisms/login-form/login-form.component.ts`
- Test: `frontend/src/app/shared/ui/organisms/login-form/login-form.component.spec.ts`

**Interfaces:**
- Consumes: `FieldComponent`, `TextInputComponent`, `ButtonComponent` (atoms/molecules da F1b-1), `FormField`, `fieldError`.
- Produces: `LoginFormComponent` (`ui-login-form`): inputs `loading: boolean`, `errorMsg: string | null`; output `submitted: EventEmitter<{ email: string; senha: string }>`. Valida email (obrigatório + formato) e senha (obrigatória); emite só quando válido.

- [x] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/shared/ui/organisms/login-form/login-form.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { LoginFormComponent } from './login-form.component';

async function render() {
  await TestBed.configureTestingModule({ imports: [LoginFormComponent] }).compileComponents();
  const fx = TestBed.createComponent(LoginFormComponent);
  fx.detectChanges();
  return fx;
}

function type(fx: { nativeElement: unknown }, id: string, value: string) {
  const input = (fx.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('LoginFormComponent', () => {
  it('não emite quando inválido (submit vazio)', async () => {
    const fx = await render();
    const spy = vi.fn();
    fx.componentInstance.submitted.subscribe(spy);
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fx.detectChanges();
    expect(spy).not.toHaveBeenCalled();
  });

  it('emite e-mail e senha quando válido', async () => {
    const fx = await render();
    const spy = vi.fn();
    fx.componentInstance.submitted.subscribe(spy);
    type(fx, 'email', 'ana@ex.com');
    type(fx, 'senha', 'segredo123');
    fx.detectChanges();
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fx.detectChanges();
    expect(spy).toHaveBeenCalledWith({ email: 'ana@ex.com', senha: 'segredo123' });
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test login-form`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar**

Create `frontend/src/app/shared/ui/organisms/login-form/login-form.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { FieldComponent } from '../../molecules/field/field.component';
import { TextInputComponent } from '../../atoms/text-input/text-input.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { ErrorLabelComponent } from '../../atoms/error-label/error-label.component';
import { fieldError } from '../../forms/field-error';

@Component({
  selector: 'ui-login-form',
  standalone: true,
  imports: [FormField, FieldComponent, TextInputComponent, ButtonComponent, ErrorLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="onSubmit($event)" novalidate>
      <ui-field label="E-mail" for="email" [error]="err(f.email)">
        <ui-text-input [formField]="f.email" id="email" type="email" placeholder="voce@exemplo.com" />
      </ui-field>
      <ui-field label="Senha" for="senha" [error]="err(f.senha)">
        <ui-text-input [formField]="f.senha" id="senha" type="password" />
      </ui-field>
      <ui-error-label [message]="errorMsg()" />
      <ui-button type="submit" [loading]="loading()">Entrar</ui-button>
    </form>
  `,
  styles: `form{display:flex;flex-direction:column}ui-button{margin-top:.5rem}`,
})
export class LoginFormComponent {
  readonly loading = input(false);
  readonly errorMsg = input<string | null>(null);
  readonly submitted = output<{ email: string; senha: string }>();

  protected readonly err = fieldError;
  protected readonly model = signal({ email: '', senha: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.email, { message: 'Informe seu e-mail' });
    email(p.email, { message: 'E-mail inválido' });
    required(p.senha, { message: 'Informe sua senha' });
  });

  protected async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    await submit(this.f, async () => {
      this.submitted.emit({ ...this.model() });
    });
  }
}
```

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test login-form`
Expected: PASS (2 testes).

- [x] **Step 5: Commit**

```bash
git add frontend/src/app/shared/ui/organisms/login-form
git commit -m "feat(frontend): organism login-form com Signal Forms (TDD)"
```

---

### Task 4: `LoginComponent` (feature) + rota + consumo de convite pós-login

**Files:**
- Create: `frontend/src/app/features/auth/login/login.component.ts`
- Test: `frontend/src/app/features/auth/login/login.component.spec.ts`
- Modify: `frontend/src/app/app.routes.ts` (rota `/login`)

**Interfaces:**
- Consumes: `LoginFormComponent`, `PublicLayoutComponent`, `AuthService.signIn`, `PendingInviteFlowService.consumir`, `Router`, `RouterLink`.
- Produces: `LoginComponent` (`app-login`) com `onLogin({ email, senha })` — chama `signIn`; em erro seta `errorMsg`; em sucesso consome convite pendente e navega para `/`.

- [x] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/features/auth/login/login.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';
import { PendingInviteFlowService } from '../../../core/convite/pending-invite-flow.service';

describe('LoginComponent', () => {
  const signIn = vi.fn();
  const consumir = vi.fn().mockReturnValue(of(false));
  let navigate: ReturnType<typeof vi.fn>;

  async function make() {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { signIn } },
        { provide: PendingInviteFlowService, useValue: { consumir } },
      ],
    }).compileComponents();
    const fx = TestBed.createComponent(LoginComponent);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fx.detectChanges();
    return fx.componentInstance;
  }

  beforeEach(() => { signIn.mockReset(); consumir.mockClear(); });

  it('login com sucesso consome convite e navega para /', async () => {
    signIn.mockResolvedValue({ error: null });
    const c = await make();
    await c.onLogin({ email: 'ana@ex.com', senha: 'segredo123' });
    expect(signIn).toHaveBeenCalledWith('ana@ex.com', 'segredo123');
    expect(consumir).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('erro de credencial seta errorMsg e não navega', async () => {
    signIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    const c = await make();
    await c.onLogin({ email: 'ana@ex.com', senha: 'errada' });
    expect(c.errorMsg()).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test login.component`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar**

Create `frontend/src/app/features/auth/login/login.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { PendingInviteFlowService } from '../../../core/convite/pending-invite-flow.service';
import { LoginFormComponent } from '../../../shared/ui/organisms/login-form/login-form.component';
import { PublicLayoutComponent } from '../../../shared/ui/templates/public-layout/public-layout.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LoginFormComponent, PublicLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      <h1>Entrar</h1>
      <ui-login-form [loading]="loading()" [errorMsg]="errorMsg()" (submitted)="onLogin($event)" />
      <nav class="links">
        <a routerLink="/esqueci-senha">Esqueci minha senha</a>
        <a routerLink="/cadastro">Criar conta</a>
      </nav>
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 1rem;font-size:1.4rem;color:#334155}.links{display:flex;justify-content:space-between;margin-top:1rem;font-size:.9rem}a{color:#5DBB8A;text-decoration:none}`,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly invites = inject(PendingInviteFlowService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  async onLogin({ email, senha }: { email: string; senha: string }): Promise<void> {
    this.loading.set(true);
    this.errorMsg.set(null);
    const { error } = await this.auth.signIn(email, senha);
    if (error) {
      this.errorMsg.set('E-mail ou senha inválidos.');
      this.loading.set(false);
      return;
    }
    await firstValueFrom(this.invites.consumir());
    this.loading.set(false);
    void this.router.navigate(['/']);
  }
}
```

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test login.component`
Expected: PASS (2 testes).

- [x] **Step 5: Registrar a rota `/login`**

Modify `frontend/src/app/app.routes.ts` — substituir o conteúdo por (mantém home; adiciona login com `guestGuard`):

```ts
import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
];
```

> Nota: a home migra de `component:` eager para `loadComponent:` lazy (sem guard ainda — `authGuard` entra na Task 15, junto da lógica de `/me`). As demais rotas são acrescentadas nas próximas tasks.

- [x] **Step 6: Build + commit**

Run: `pnpm --filter frontend build --configuration development`
Expected: build OK.

```bash
git add frontend/src/app/features/auth/login frontend/src/app/app.routes.ts
git commit -m "feat(frontend): tela /login (organism + smart component) com consumo de convite pós-login (TDD)"
```

---

### Task 5: `CadastroFormComponent` (organism)

**Files:**
- Create: `frontend/src/app/shared/ui/organisms/cadastro-form/cadastro-form.component.ts`
- Test: `frontend/src/app/shared/ui/organisms/cadastro-form/cadastro-form.component.spec.ts`

**Interfaces:**
- Produces: `CadastroFormComponent` (`ui-cadastro-form`): inputs `loading`, `errorMsg`; output `submitted: EventEmitter<{ nome: string; email: string; senha: string }>`. Campos: nome (obrigatório), email (obrigatório+formato), senha (obrigatória, mín. 8), confirmar (deve igualar senha), aceite LGPD (obrigatório, com link para `/termos`). Emite só quando válido.

- [x] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/shared/ui/organisms/cadastro-form/cadastro-form.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CadastroFormComponent } from './cadastro-form.component';

async function render() {
  await TestBed.configureTestingModule({
    imports: [CadastroFormComponent],
    providers: [provideRouter([])],
  }).compileComponents();
  const fx = TestBed.createComponent(CadastroFormComponent);
  fx.detectChanges();
  return fx;
}

function type(fx: { nativeElement: unknown }, id: string, value: string) {
  const el = (fx.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLInputElement;
  el.value = value;
  el.dispatchEvent(new Event('input'));
}
function check(fx: { nativeElement: unknown }, id: string) {
  const el = (fx.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLInputElement;
  el.checked = true;
  el.dispatchEvent(new Event('change'));
}

describe('CadastroFormComponent', () => {
  it('não emite quando senha e confirmação divergem', async () => {
    const fx = await render();
    const spy = vi.fn();
    fx.componentInstance.submitted.subscribe(spy);
    type(fx, 'nome', 'Ana');
    type(fx, 'email', 'ana@ex.com');
    type(fx, 'senha', 'segredo123');
    type(fx, 'confirmar', 'outra-coisa');
    check(fx, 'aceite');
    fx.detectChanges();
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fx.detectChanges();
    expect(spy).not.toHaveBeenCalled();
  });

  it('emite nome/email/senha quando válido e aceite marcado', async () => {
    const fx = await render();
    const spy = vi.fn();
    fx.componentInstance.submitted.subscribe(spy);
    type(fx, 'nome', 'Ana');
    type(fx, 'email', 'ana@ex.com');
    type(fx, 'senha', 'segredo123');
    type(fx, 'confirmar', 'segredo123');
    check(fx, 'aceite');
    fx.detectChanges();
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fx.detectChanges();
    expect(spy).toHaveBeenCalledWith({ nome: 'Ana', email: 'ana@ex.com', senha: 'segredo123' });
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test cadastro-form`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar**

Create `frontend/src/app/shared/ui/organisms/cadastro-form/cadastro-form.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { email, form, FormField, minLength, required, submit, validate } from '@angular/forms/signals';
import { FieldComponent } from '../../molecules/field/field.component';
import { TextInputComponent } from '../../atoms/text-input/text-input.component';
import { CheckboxComponent } from '../../atoms/checkbox/checkbox.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { ErrorLabelComponent } from '../../atoms/error-label/error-label.component';
import { fieldError } from '../../forms/field-error';

@Component({
  selector: 'ui-cadastro-form',
  standalone: true,
  imports: [FormField, RouterLink, FieldComponent, TextInputComponent, CheckboxComponent, ButtonComponent, ErrorLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="onSubmit($event)" novalidate>
      <ui-field label="Nome" for="nome" [error]="err(f.nome)">
        <ui-text-input [formField]="f.nome" id="nome" />
      </ui-field>
      <ui-field label="E-mail" for="email" [error]="err(f.email)">
        <ui-text-input [formField]="f.email" id="email" type="email" />
      </ui-field>
      <ui-field label="Senha" for="senha" [error]="err(f.senha)">
        <ui-text-input [formField]="f.senha" id="senha" type="password" />
      </ui-field>
      <ui-field label="Confirmar senha" for="confirmar" [error]="err(f.confirmar)">
        <ui-text-input [formField]="f.confirmar" id="confirmar" type="password" />
      </ui-field>
      <ui-checkbox [formField]="f.aceite" id="aceite">
        Li e aceito os <a routerLink="/termos">termos e a política de privacidade</a>
      </ui-checkbox>
      <ui-error-label [message]="err(f.aceite)" />
      <ui-error-label [message]="errorMsg()" />
      <ui-button type="submit" [loading]="loading()">Criar conta</ui-button>
    </form>
  `,
  styles: `form{display:flex;flex-direction:column}ui-button{margin-top:.75rem}a{color:#5DBB8A}`,
})
export class CadastroFormComponent {
  readonly loading = input(false);
  readonly errorMsg = input<string | null>(null);
  readonly submitted = output<{ nome: string; email: string; senha: string }>();

  protected readonly err = fieldError;
  protected readonly model = signal({ nome: '', email: '', senha: '', confirmar: '', aceite: false });
  protected readonly f = form(this.model, (p) => {
    required(p.nome, { message: 'Informe seu nome' });
    required(p.email, { message: 'Informe seu e-mail' });
    email(p.email, { message: 'E-mail inválido' });
    required(p.senha, { message: 'Informe uma senha' });
    minLength(p.senha, 8, { message: 'Mínimo de 8 caracteres' });
    validate(p.confirmar, (ctx) =>
      ctx.value() !== ctx.valueOf(p.senha) ? { kind: 'mismatch', message: 'As senhas não coincidem' } : null,
    );
    required(p.aceite, { message: 'É necessário aceitar os termos' });
  });

  protected async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    await submit(this.f, async () => {
      const { nome, email: mail, senha } = this.model();
      this.submitted.emit({ nome, email: mail, senha });
    });
  }
}
```

> Nota Signal Forms: `validate(path, ctx => ...)` recebe um `FieldContext` cujo `ctx.value()` é o valor do próprio campo e `ctx.valueOf(otherPath)` lê outro campo do mesmo form — usado aqui para a confirmação de senha. `required` num boolean (`aceite`) falha quando `false`.

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test cadastro-form`
Expected: PASS (2 testes).

> Se a release expor o contexto cruzado com nome diferente de `ctx.valueOf`, ajustar para a API equivalente desta versão (o teste de "senhas divergem" é o detector). Alternativa garantida: ler `this.model().senha` dentro do `validate` em vez de `ctx.valueOf(p.senha)`.

- [x] **Step 5: Commit**

```bash
git add frontend/src/app/shared/ui/organisms/cadastro-form
git commit -m "feat(frontend): organism cadastro-form (validação cruzada de senha + aceite LGPD) — TDD"
```

---

### Task 6: `CadastroComponent` (feature) + rota

**Files:**
- Create: `frontend/src/app/features/auth/cadastro/cadastro.component.ts`
- Test: `frontend/src/app/features/auth/cadastro/cadastro.component.spec.ts`
- Modify: `frontend/src/app/app.routes.ts`

**Interfaces:**
- Consumes: `CadastroFormComponent`, `PublicLayoutComponent`, `AuthService.signUp`, `Router`.
- Produces: `CadastroComponent` (`app-cadastro`) com `onCadastro({ nome, email, senha })` — chama `signUp`; sucesso → `/confirmar-email`; erro → `errorMsg`.

- [x] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/features/auth/cadastro/cadastro.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CadastroComponent } from './cadastro.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('CadastroComponent', () => {
  const signUp = vi.fn();
  let navigate: ReturnType<typeof vi.fn>;

  async function make() {
    await TestBed.configureTestingModule({
      imports: [CadastroComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { signUp } }],
    }).compileComponents();
    const fx = TestBed.createComponent(CadastroComponent);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fx.detectChanges();
    return fx.componentInstance;
  }

  beforeEach(() => signUp.mockReset());

  it('cadastro com sucesso navega para /confirmar-email', async () => {
    signUp.mockResolvedValue({ error: null });
    const c = await make();
    await c.onCadastro({ nome: 'Ana', email: 'ana@ex.com', senha: 'segredo123' });
    expect(signUp).toHaveBeenCalledWith('Ana', 'ana@ex.com', 'segredo123');
    expect(navigate).toHaveBeenCalledWith(['/confirmar-email']);
  });

  it('erro de cadastro seta errorMsg e não navega', async () => {
    signUp.mockResolvedValue({ error: { message: 'User already registered' } });
    const c = await make();
    await c.onCadastro({ nome: 'Ana', email: 'ana@ex.com', senha: 'segredo123' });
    expect(c.errorMsg()).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test cadastro.component`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar**

Create `frontend/src/app/features/auth/cadastro/cadastro.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CadastroFormComponent } from '../../../shared/ui/organisms/cadastro-form/cadastro-form.component';
import { PublicLayoutComponent } from '../../../shared/ui/templates/public-layout/public-layout.component';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CadastroFormComponent, PublicLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      <h1>Criar conta</h1>
      <ui-cadastro-form [loading]="loading()" [errorMsg]="errorMsg()" (submitted)="onCadastro($event)" />
      <p class="links">Já tem conta? <a routerLink="/login">Entrar</a></p>
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 1rem;font-size:1.4rem;color:#334155}.links{margin-top:1rem;font-size:.9rem}a{color:#5DBB8A;text-decoration:none}`,
})
export class CadastroComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  async onCadastro({ nome, email, senha }: { nome: string; email: string; senha: string }): Promise<void> {
    this.loading.set(true);
    this.errorMsg.set(null);
    const { error } = await this.auth.signUp(nome, email, senha);
    this.loading.set(false);
    if (error) {
      this.errorMsg.set('Não foi possível criar a conta. Verifique os dados ou tente outro e-mail.');
      return;
    }
    void this.router.navigate(['/confirmar-email']);
  }
}
```

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test cadastro.component`
Expected: PASS (2 testes).

- [x] **Step 5: Registrar a rota `/cadastro` (com `guestGuard`)**

Modify `frontend/src/app/app.routes.ts` — adicionar, após a rota `/login`:

```ts
  {
    path: 'cadastro',
    loadComponent: () => import('./features/auth/cadastro/cadastro.component').then((m) => m.CadastroComponent),
    canActivate: [guestGuard],
  },
```

- [x] **Step 6: Commit**

```bash
git add frontend/src/app/features/auth/cadastro frontend/src/app/app.routes.ts
git commit -m "feat(frontend): tela /cadastro → signUp → /confirmar-email (TDD)"
```

---

### Task 7: Telas estáticas `/termos` e `/confirmar-email` + rotas

**Files:**
- Create: `frontend/src/app/features/auth/termos/termos.component.ts`
- Create: `frontend/src/app/features/auth/confirmar-email/confirmar-email.component.ts`
- Test: `frontend/src/app/features/auth/confirmar-email/confirmar-email.component.spec.ts`
- Modify: `frontend/src/app/app.routes.ts`

**Interfaces:**
- Produces: `TermosComponent` (`app-termos`) — texto fixo versão `v1` + link voltar; `ConfirmarEmailComponent` (`app-confirmar-email`) — mensagem "verifique seu e-mail" + link `/login`.

- [x] **Step 1: Escrever o teste do `ConfirmarEmailComponent` (que falha)**

Create `frontend/src/app/features/auth/confirmar-email/confirmar-email.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmarEmailComponent } from './confirmar-email.component';

describe('ConfirmarEmailComponent', () => {
  it('mostra instrução de verificação e link para login', async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmarEmailComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fx = TestBed.createComponent(ConfirmarEmailComponent);
    fx.detectChanges();
    const el = fx.nativeElement as HTMLElement;
    expect(el.textContent).toContain('e-mail');
    expect(el.querySelector('a[href="/login"]')).not.toBeNull();
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test confirmar-email`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar as duas telas**

Create `frontend/src/app/features/auth/confirmar-email/confirmar-email.component.ts`:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicLayoutComponent } from '../../../shared/ui/templates/public-layout/public-layout.component';

@Component({
  selector: 'app-confirmar-email',
  standalone: true,
  imports: [PublicLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      <h1>Confirme seu e-mail</h1>
      <p>Enviamos um link de confirmação para o seu e-mail. Abra-o para ativar sua conta e depois faça login.</p>
      <a routerLink="/login" class="btn-link">Ir para o login</a>
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 1rem;font-size:1.4rem;color:#334155}p{color:#475569;line-height:1.5}.btn-link{display:inline-block;margin-top:1rem;color:#5DBB8A;font-weight:600;text-decoration:none}`,
})
export class ConfirmarEmailComponent {}
```

Create `frontend/src/app/features/auth/termos/termos.component.ts`:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicLayoutComponent } from '../../../shared/ui/templates/public-layout/public-layout.component';

@Component({
  selector: 'app-termos',
  standalone: true,
  imports: [PublicLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      <h1>Termos de Uso e Política de Privacidade</h1>
      <p class="versao">Versão v1</p>
      <p>
        Ao usar o Crescendo Juntos, você concorda com o tratamento dos seus dados pessoais conforme a LGPD,
        exclusivamente para o acompanhamento da gestação e o compartilhamento com as pessoas que você convidar.
        Você pode revogar o consentimento e solicitar a exclusão dos seus dados a qualquer momento.
      </p>
      <p>Este é um texto provisório (v1), sujeito a revisão jurídica antes do lançamento.</p>
      <a routerLink="/cadastro" class="btn-link">Voltar ao cadastro</a>
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 .5rem;font-size:1.3rem;color:#334155}.versao{color:#94a3b8;font-size:.85rem;margin:0 0 1rem}p{color:#475569;line-height:1.5}.btn-link{display:inline-block;margin-top:1rem;color:#5DBB8A;font-weight:600;text-decoration:none}`,
})
export class TermosComponent {}
```

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test confirmar-email`
Expected: PASS (1 teste).

- [x] **Step 5: Registrar as rotas `/termos` e `/confirmar-email` (públicas)**

Modify `frontend/src/app/app.routes.ts` — adicionar (sem guard):

```ts
  {
    path: 'termos',
    loadComponent: () => import('./features/auth/termos/termos.component').then((m) => m.TermosComponent),
  },
  {
    path: 'confirmar-email',
    loadComponent: () => import('./features/auth/confirmar-email/confirmar-email.component').then((m) => m.ConfirmarEmailComponent),
  },
```

- [x] **Step 6: Commit**

```bash
git add frontend/src/app/features/auth/termos frontend/src/app/features/auth/confirmar-email frontend/src/app/app.routes.ts
git commit -m "feat(frontend): telas estáticas /termos (v1) e /confirmar-email (TDD)"
```

---

### Task 8: `/esqueci-senha` (feature)

**Files:**
- Create: `frontend/src/app/features/auth/esqueci-senha/esqueci-senha.component.ts`
- Test: `frontend/src/app/features/auth/esqueci-senha/esqueci-senha.component.spec.ts`
- Modify: `frontend/src/app/app.routes.ts`

**Interfaces:**
- Consumes: `ApiService.esqueciSenha`, `FieldComponent`, `TextInputComponent`, `ButtonComponent`, `PublicLayoutComponent`, `FormField`, `fieldError`.
- Produces: `EsqueciSenhaComponent` (`app-esqueci-senha`) — form de e-mail; `onSubmit()` chama `esqueciSenha` e mostra estado de sucesso (sem revelar se o e-mail existe). Sucesso por signal `enviado`.

- [x] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/features/auth/esqueci-senha/esqueci-senha.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EsqueciSenhaComponent } from './esqueci-senha.component';
import { ApiService } from '../../../core/api/api.service';

describe('EsqueciSenhaComponent', () => {
  const esqueciSenha = vi.fn().mockReturnValue(of(undefined));

  async function make() {
    await TestBed.configureTestingModule({
      imports: [EsqueciSenhaComponent],
      providers: [provideRouter([]), { provide: ApiService, useValue: { esqueciSenha } }],
    }).compileComponents();
    const fx = TestBed.createComponent(EsqueciSenhaComponent);
    fx.detectChanges();
    return fx;
  }

  beforeEach(() => esqueciSenha.mockClear());

  it('enviar com e-mail válido chama a API e mostra confirmação', async () => {
    const fx = await make();
    const input = (fx.nativeElement as HTMLElement).querySelector('#email') as HTMLInputElement;
    input.value = 'ana@ex.com';
    input.dispatchEvent(new Event('input'));
    fx.detectChanges();
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    await fx.whenStable();
    fx.detectChanges();
    expect(esqueciSenha).toHaveBeenCalledWith({ email: 'ana@ex.com' });
    expect(fx.componentInstance.enviado()).toBe(true);
  });

  it('não chama a API com e-mail inválido', async () => {
    const fx = await make();
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    await fx.whenStable();
    expect(esqueciSenha).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test esqueci-senha`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar**

Create `frontend/src/app/features/auth/esqueci-senha/esqueci-senha.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { ApiService } from '../../../core/api/api.service';
import { FieldComponent } from '../../../shared/ui/molecules/field/field.component';
import { TextInputComponent } from '../../../shared/ui/atoms/text-input/text-input.component';
import { ButtonComponent } from '../../../shared/ui/atoms/button/button.component';
import { PublicLayoutComponent } from '../../../shared/ui/templates/public-layout/public-layout.component';
import { fieldError } from '../../../shared/ui/forms/field-error';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [FormField, RouterLink, FieldComponent, TextInputComponent, ButtonComponent, PublicLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      @if (enviado()) {
        <h1>Verifique seu e-mail</h1>
        <p>Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.</p>
        <a routerLink="/login" class="btn-link">Voltar ao login</a>
      } @else {
        <h1>Esqueci minha senha</h1>
        <form (submit)="onSubmit($event)" novalidate>
          <ui-field label="E-mail" for="email" [error]="err(f.email)">
            <ui-text-input [formField]="f.email" id="email" type="email" />
          </ui-field>
          <ui-button type="submit" [loading]="loading()">Enviar link</ui-button>
        </form>
      }
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 1rem;font-size:1.4rem;color:#334155}p{color:#475569;line-height:1.5}.btn-link{display:inline-block;margin-top:1rem;color:#5DBB8A;font-weight:600;text-decoration:none}`,
})
export class EsqueciSenhaComponent {
  private readonly api = inject(ApiService);

  protected readonly err = fieldError;
  readonly loading = signal(false);
  readonly enviado = signal(false);
  protected readonly model = signal({ email: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.email, { message: 'Informe seu e-mail' });
    email(p.email, { message: 'E-mail inválido' });
  });

  protected async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    await submit(this.f, async () => {
      this.loading.set(true);
      await firstValueFrom(this.api.esqueciSenha({ email: this.model().email }));
      this.loading.set(false);
      this.enviado.set(true);
    });
  }
}
```

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test esqueci-senha`
Expected: PASS (2 testes).

- [x] **Step 5: Registrar a rota `/esqueci-senha` (pública) + commit**

Modify `frontend/src/app/app.routes.ts` — adicionar:

```ts
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./features/auth/esqueci-senha/esqueci-senha.component').then((m) => m.EsqueciSenhaComponent),
  },
```

```bash
git add frontend/src/app/features/auth/esqueci-senha frontend/src/app/app.routes.ts
git commit -m "feat(frontend): tela /esqueci-senha → POST /auth/esqueci-senha (TDD)"
```

---

### Task 9: `/redefinir-senha` (feature)

**Files:**
- Create: `frontend/src/app/features/auth/redefinir-senha/redefinir-senha.component.ts`
- Test: `frontend/src/app/features/auth/redefinir-senha/redefinir-senha.component.spec.ts`
- Modify: `frontend/src/app/app.routes.ts`

**Interfaces:**
- Consumes: `AuthService.updatePassword`, `Router`, atoms/molecules, `FormField`, `fieldError`.
- Produces: `RedefinirSenhaComponent` (`app-redefinir-senha`) — form senha + confirmar (mín. 8, devem coincidir); `onSubmit()` chama `updatePassword`; sucesso → `/login`; erro → `errorMsg`.

- [x] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/features/auth/redefinir-senha/redefinir-senha.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RedefinirSenhaComponent } from './redefinir-senha.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('RedefinirSenhaComponent', () => {
  const updatePassword = vi.fn();
  let navigate: ReturnType<typeof vi.fn>;

  async function make() {
    await TestBed.configureTestingModule({
      imports: [RedefinirSenhaComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { updatePassword } }],
    }).compileComponents();
    const fx = TestBed.createComponent(RedefinirSenhaComponent);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fx.detectChanges();
    return fx;
  }

  beforeEach(() => updatePassword.mockReset());

  function type(fx: { nativeElement: unknown }, id: string, value: string) {
    const el = (fx.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLInputElement;
    el.value = value;
    el.dispatchEvent(new Event('input'));
  }

  it('define a nova senha e navega para /login', async () => {
    updatePassword.mockResolvedValue({ error: null });
    const fx = await make();
    type(fx, 'senha', 'novaSenha123');
    type(fx, 'confirmar', 'novaSenha123');
    fx.detectChanges();
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    await fx.whenStable();
    expect(updatePassword).toHaveBeenCalledWith('novaSenha123');
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('não chama updatePassword quando as senhas divergem', async () => {
    const fx = await make();
    type(fx, 'senha', 'novaSenha123');
    type(fx, 'confirmar', 'diferente1');
    fx.detectChanges();
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    await fx.whenStable();
    expect(updatePassword).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test redefinir-senha`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar**

Create `frontend/src/app/features/auth/redefinir-senha/redefinir-senha.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, minLength, required, submit, validate } from '@angular/forms/signals';
import { AuthService } from '../../../core/auth/auth.service';
import { FieldComponent } from '../../../shared/ui/molecules/field/field.component';
import { TextInputComponent } from '../../../shared/ui/atoms/text-input/text-input.component';
import { ButtonComponent } from '../../../shared/ui/atoms/button/button.component';
import { ErrorLabelComponent } from '../../../shared/ui/atoms/error-label/error-label.component';
import { PublicLayoutComponent } from '../../../shared/ui/templates/public-layout/public-layout.component';
import { fieldError } from '../../../shared/ui/forms/field-error';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [FormField, FieldComponent, TextInputComponent, ButtonComponent, ErrorLabelComponent, PublicLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      <h1>Definir nova senha</h1>
      <form (submit)="onSubmit($event)" novalidate>
        <ui-field label="Nova senha" for="senha" [error]="err(f.senha)">
          <ui-text-input [formField]="f.senha" id="senha" type="password" />
        </ui-field>
        <ui-field label="Confirmar senha" for="confirmar" [error]="err(f.confirmar)">
          <ui-text-input [formField]="f.confirmar" id="confirmar" type="password" />
        </ui-field>
        <ui-error-label [message]="errorMsg()" />
        <ui-button type="submit" [loading]="loading()">Salvar nova senha</ui-button>
      </form>
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 1rem;font-size:1.4rem;color:#334155}form{display:flex;flex-direction:column}ui-button{margin-top:.5rem}`,
})
export class RedefinirSenhaComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly err = fieldError;
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  protected readonly model = signal({ senha: '', confirmar: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.senha, { message: 'Informe uma senha' });
    minLength(p.senha, 8, { message: 'Mínimo de 8 caracteres' });
    validate(p.confirmar, (ctx) =>
      ctx.value() !== ctx.valueOf(p.senha) ? { kind: 'mismatch', message: 'As senhas não coincidem' } : null,
    );
  });

  protected async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    await submit(this.f, async () => {
      this.loading.set(true);
      this.errorMsg.set(null);
      const { error } = await this.auth.updatePassword(this.model().senha);
      this.loading.set(false);
      if (error) {
        this.errorMsg.set('Não foi possível redefinir a senha. O link pode ter expirado — solicite outro.');
        return;
      }
      void this.router.navigate(['/login']);
    });
  }
}
```

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test redefinir-senha`
Expected: PASS (2 testes).

- [x] **Step 5: Registrar a rota `/redefinir-senha` (pública) + commit**

Modify `frontend/src/app/app.routes.ts` — adicionar:

```ts
  {
    path: 'redefinir-senha',
    loadComponent: () => import('./features/auth/redefinir-senha/redefinir-senha.component').then((m) => m.RedefinirSenhaComponent),
  },
```

```bash
git add frontend/src/app/features/auth/redefinir-senha frontend/src/app/app.routes.ts
git commit -m "feat(frontend): tela /redefinir-senha → updatePassword → /login (TDD)"
```

---

### Task 10: `/convite/:token` (feature)

**Files:**
- Create: `frontend/src/app/features/convite/convite.component.ts`
- Test: `frontend/src/app/features/convite/convite.component.spec.ts`
- Modify: `frontend/src/app/app.routes.ts`

**Interfaces:**
- Consumes: `ActivatedRoute` (`:token`), `PendingInviteService.set`, `ApiService.consultarConvite`, `AuthService.isAuthenticated`, `PendingInviteFlowService.consumir`, `Router`, `PublicLayoutComponent`, `ButtonComponent`, `RouterLink`.
- Produces: `ConviteComponent` (`app-convite`) — no `ngOnInit`: **grava o token em localStorage** e consulta o convite. Se já autenticado, consome o convite e navega `/`. Senão, exibe papel + nome da gestante + botões Entrar/Criar conta. Estado por signals: `convite`, `erro`, `papelLabel`.

- [x] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/features/convite/convite.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { ConviteComponent } from './convite.component';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { PendingInviteService } from '../../core/auth/pending-invite.service';
import { PendingInviteFlowService } from '../../core/convite/pending-invite-flow.service';

describe('ConviteComponent', () => {
  const set = vi.fn();
  const consultarConvite = vi.fn().mockReturnValue(of({ papel: 'parceiro', nome_gestante: 'Ana' }));
  const consumir = vi.fn().mockReturnValue(of(true));
  let navigate: ReturnType<typeof vi.fn>;

  async function make(authed: boolean) {
    await TestBed.configureTestingModule({
      imports: [ConviteComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'tok-7' } } } },
        { provide: PendingInviteService, useValue: { set } },
        { provide: ApiService, useValue: { consultarConvite } },
        { provide: AuthService, useValue: { isAuthenticated: () => authed } },
        { provide: PendingInviteFlowService, useValue: { consumir } },
      ],
    }).compileComponents();
    const fx = TestBed.createComponent(ConviteComponent);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fx.detectChanges();
    await fx.whenStable();
    return fx;
  }

  beforeEach(() => { set.mockClear(); consultarConvite.mockClear(); consumir.mockClear(); });

  it('grava o token e, se autenticado, consome e vai para /', async () => {
    await make(true);
    expect(set).toHaveBeenCalledWith('tok-7');
    expect(consumir).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('não autenticado: grava o token, consulta e mostra o convite', async () => {
    const fx = await make(false);
    expect(set).toHaveBeenCalledWith('tok-7');
    expect(consultarConvite).toHaveBeenCalledWith('tok-7');
    expect(consumir).not.toHaveBeenCalled();
    expect((fx.nativeElement as HTMLElement).textContent).toContain('Ana');
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test convite.component`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar**

Create `frontend/src/app/features/convite/convite.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ConsultarConviteResponse } from '@crescendo/shared';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { PendingInviteService } from '../../core/auth/pending-invite.service';
import { PendingInviteFlowService } from '../../core/convite/pending-invite-flow.service';
import { PublicLayoutComponent } from '../../shared/ui/templates/public-layout/public-layout.component';

@Component({
  selector: 'app-convite',
  standalone: true,
  imports: [PublicLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      @if (erro()) {
        <h1>Convite inválido</h1>
        <p>Este convite não existe, expirou ou já foi utilizado.</p>
        <a routerLink="/login" class="btn-link">Ir para o login</a>
      } @else if (convite(); as c) {
        <h1>Você foi convidada(o)!</h1>
        <p><strong>{{ c.nome_gestante }}</strong> convidou você para participar como <strong>{{ papelLabel(c.papel) }}</strong>.</p>
        <div class="acoes">
          <a routerLink="/login" class="btn-primary">Entrar</a>
          <a routerLink="/cadastro" class="btn-link">Criar conta</a>
        </div>
      } @else {
        <p>Carregando convite…</p>
      }
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 1rem;font-size:1.4rem;color:#334155}p{color:#475569;line-height:1.5}.acoes{display:flex;gap:1rem;align-items:center;margin-top:1.25rem}.btn-primary{background:#5DBB8A;color:#fff;padding:.6rem 1rem;border-radius:.5rem;font-weight:600;text-decoration:none}.btn-link{color:#5DBB8A;font-weight:600;text-decoration:none}`,
})
export class ConviteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly pending = inject(PendingInviteService);
  private readonly flow = inject(PendingInviteFlowService);
  private readonly router = inject(Router);

  readonly convite = signal<ConsultarConviteResponse | null>(null);
  readonly erro = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.pending.set(token);

    if (this.auth.isAuthenticated()) {
      this.flow.consumir().subscribe(() => void this.router.navigate(['/']));
      return;
    }
    this.api.consultarConvite(token).subscribe({
      next: (c) => this.convite.set(c),
      error: () => this.erro.set(true),
    });
  }

  protected papelLabel(papel: ConsultarConviteResponse['papel']): string {
    return papel === 'parceiro' ? 'parceiro(a)' : 'familiar';
  }
}
```

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test convite.component`
Expected: PASS (2 testes).

- [x] **Step 5: Registrar a rota `/convite/:token` (pública) + commit**

Modify `frontend/src/app/app.routes.ts` — adicionar:

```ts
  {
    path: 'convite/:token',
    loadComponent: () => import('./features/convite/convite.component').then((m) => m.ConviteComponent),
  },
```

```bash
git add frontend/src/app/features/convite frontend/src/app/app.routes.ts
git commit -m "feat(frontend): tela /convite/:token (grava token, aceita se logado) — TDD"
```

---

### Task 11: Wizard — `PerfilStepComponent` (passo 1)

**Files:**
- Create: `frontend/src/app/shared/ui/organisms/perfil-step/perfil-step.component.ts`
- Test: `frontend/src/app/shared/ui/organisms/perfil-step/perfil-step.component.spec.ts`

**Interfaces:**
- Consumes: `MunicipioResponse[]` (input), atoms/molecules, `FormField`, `fieldError`.
- Produces: `PerfilStepComponent` (`ui-perfil-step`): input `municipios: MunicipioResponse[]`; output `completed: EventEmitter<{ nome: string; data_nascimento: string; municipio_id: number }>`. Campos: nome (obrigatório), data_nascimento (`<input type="date">`, obrigatório), município (`<select>`, obrigatório). Emite só quando válido; converte `municipio_id` para número.

- [x] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/shared/ui/organisms/perfil-step/perfil-step.component.spec.ts`:

```ts
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PerfilStepComponent } from './perfil-step.component';
import type { MunicipioResponse } from '@crescendo/shared';

@Component({
  standalone: true,
  imports: [PerfilStepComponent],
  template: `<ui-perfil-step [municipios]="municipios()" (completed)="onDone($event)" />`,
})
class Host {
  municipios = signal<MunicipioResponse[]>([{ id: 5, nome: 'Ilhéus', uf: 'BA' }]);
  last: unknown = null;
  onDone(v: unknown) { this.last = v; }
}

describe('PerfilStepComponent', () => {
  async function render() {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fx = TestBed.createComponent(Host);
    fx.detectChanges();
    return fx;
  }
  function set(fx: { nativeElement: unknown }, sel: string, value: string, evt = 'input') {
    const el = (fx.nativeElement as HTMLElement).querySelector(sel) as HTMLInputElement | HTMLSelectElement;
    (el as HTMLInputElement).value = value;
    el.dispatchEvent(new Event(evt));
  }

  it('emite o perfil com municipio_id numérico quando válido', async () => {
    const fx = await render();
    set(fx, '#nome', 'Ana');
    set(fx, '#data_nascimento', '1995-05-05');
    set(fx, '#municipio', '5', 'change');
    fx.detectChanges();
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fx.detectChanges();
    expect(fx.componentInstance.last).toEqual({ nome: 'Ana', data_nascimento: '1995-05-05', municipio_id: 5 });
  });

  it('não emite quando faltam campos', async () => {
    const fx = await render();
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fx.detectChanges();
    expect(fx.componentInstance.last).toBeNull();
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test perfil-step`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar**

Create `frontend/src/app/shared/ui/organisms/perfil-step/perfil-step.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import type { MunicipioResponse } from '@crescendo/shared';
import { FieldComponent } from '../../molecules/field/field.component';
import { TextInputComponent } from '../../atoms/text-input/text-input.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { fieldError } from '../../forms/field-error';

@Component({
  selector: 'ui-perfil-step',
  standalone: true,
  imports: [FormField, FieldComponent, TextInputComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="onSubmit($event)" novalidate>
      <ui-field label="Seu nome" for="nome" [error]="err(f.nome)">
        <ui-text-input [formField]="f.nome" id="nome" />
      </ui-field>
      <ui-field label="Data de nascimento" for="data_nascimento" [error]="err(f.data_nascimento)">
        <ui-text-input [formField]="f.data_nascimento" id="data_nascimento" type="date" />
      </ui-field>
      <ui-field label="Município" for="municipio" [error]="err(f.municipio_id)">
        <select [formField]="f.municipio_id" id="municipio" class="sel">
          <option value="">Selecione…</option>
          @for (m of municipios(); track m.id) {
            <option [value]="m.id">{{ m.nome }} — {{ m.uf }}</option>
          }
        </select>
      </ui-field>
      <ui-button type="submit">Continuar</ui-button>
    </form>
  `,
  styles: `form{display:flex;flex-direction:column}.sel{width:100%;padding:.6rem .75rem;border:1px solid #cbd5e1;border-radius:.5rem;font-size:1rem;background:#fff}ui-button{margin-top:.5rem}`,
})
export class PerfilStepComponent {
  readonly municipios = input<MunicipioResponse[]>([]);
  readonly completed = output<{ nome: string; data_nascimento: string; municipio_id: number }>();

  protected readonly err = fieldError;
  protected readonly model = signal({ nome: '', data_nascimento: '', municipio_id: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.nome, { message: 'Informe seu nome' });
    required(p.data_nascimento, { message: 'Informe sua data de nascimento' });
    required(p.municipio_id, { message: 'Selecione um município' });
  });

  protected async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    await submit(this.f, async () => {
      const v = this.model();
      this.completed.emit({ nome: v.nome, data_nascimento: v.data_nascimento, municipio_id: Number(v.municipio_id) });
    });
  }
}
```

> Nota: `municipio_id` é mantido como **string** no form (o `<select>` emite strings) e convertido com `Number(...)` na emissão — evita atrito de parsing do Signal Forms com `<select>`.

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test perfil-step`
Expected: PASS (2 testes).

- [x] **Step 5: Commit**

```bash
git add frontend/src/app/shared/ui/organisms/perfil-step
git commit -m "feat(frontend): organism perfil-step (passo 1 do onboarding) — TDD"
```

---

### Task 12: Wizard — `GestacaoStepComponent` (passo 2)

**Files:**
- Create: `frontend/src/app/shared/ui/organisms/gestacao-step/gestacao-step.component.ts`
- Test: `frontend/src/app/shared/ui/organisms/gestacao-step/gestacao-step.component.spec.ts`

**Interfaces:**
- Produces: `GestacaoStepComponent` (`ui-gestacao-step`): output `completed: EventEmitter<{ gestacao: { dpp?: string; semanas?: number }; bebe?: { nome?: string; sexo?: SexoBebe; data_nascimento?: string } }>`. Modo "DPP" (`<input type="date">`) **ou** "semanas" (`<input type="number">`), escolhido por um toggle (signal `modo`); exatamente um vai no payload. Bebê opcional (nome/sexo/data) — incluído **só se algum campo preenchido**. Emite só quando o campo do modo ativo está preenchido.

- [x] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/shared/ui/organisms/gestacao-step/gestacao-step.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { GestacaoStepComponent } from './gestacao-step.component';

describe('GestacaoStepComponent', () => {
  async function render() {
    await TestBed.configureTestingModule({ imports: [GestacaoStepComponent] }).compileComponents();
    const fx = TestBed.createComponent(GestacaoStepComponent);
    fx.detectChanges();
    return fx;
  }
  function set(fx: { nativeElement: unknown }, sel: string, value: string) {
    const el = (fx.nativeElement as HTMLElement).querySelector(sel) as HTMLInputElement;
    el.value = value;
    el.dispatchEvent(new Event('input'));
  }

  it('modo semanas: emite { gestacao: { semanas } } sem bebê', async () => {
    const fx = await render();
    fx.componentInstance.setModo('semanas');
    fx.detectChanges();
    set(fx, '#semanas', '12');
    fx.detectChanges();
    const spy = vi.fn();
    fx.componentInstance.completed.subscribe(spy);
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fx.detectChanges();
    expect(spy).toHaveBeenCalledWith({ gestacao: { semanas: 12 } });
  });

  it('modo DPP com nome de bebê: inclui o bebê', async () => {
    const fx = await render();
    set(fx, '#dpp', '2026-01-10');
    set(fx, '#bebe_nome', 'Bebê Feliz');
    fx.detectChanges();
    const spy = vi.fn();
    fx.componentInstance.completed.subscribe(spy);
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fx.detectChanges();
    expect(spy).toHaveBeenCalledWith({ gestacao: { dpp: '2026-01-10' }, bebe: { nome: 'Bebê Feliz' } });
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test gestacao-step`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar**

Create `frontend/src/app/shared/ui/organisms/gestacao-step/gestacao-step.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import type { SexoBebe } from '@crescendo/shared';
import { FieldComponent } from '../../molecules/field/field.component';
import { ButtonComponent } from '../../atoms/button/button.component';

type GestacaoPayload = {
  gestacao: { dpp?: string; semanas?: number };
  bebe?: { nome?: string; sexo?: SexoBebe; data_nascimento?: string };
};

@Component({
  selector: 'ui-gestacao-step',
  standalone: true,
  imports: [FieldComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="onSubmit($event)" novalidate>
      <div class="toggle">
        <button type="button" [class.on]="modo() === 'dpp'" (click)="setModo('dpp')">Sei a data provável (DPP)</button>
        <button type="button" [class.on]="modo() === 'semanas'" (click)="setModo('semanas')">Estou em X semanas</button>
      </div>

      @if (modo() === 'dpp') {
        <ui-field label="Data provável do parto" for="dpp" [error]="erroGestacao()">
          <input id="dpp" type="date" class="inp" [value]="dpp()" (input)="dpp.set($any($event.target).value)" />
        </ui-field>
      } @else {
        <ui-field label="Semanas de gestação" for="semanas" [error]="erroGestacao()">
          <input id="semanas" type="number" min="1" max="42" class="inp" [value]="semanas()" (input)="semanas.set($any($event.target).value)" />
        </ui-field>
      }

      <fieldset class="bebe">
        <legend>Sobre o bebê (opcional)</legend>
        <ui-field label="Nome ou apelido" for="bebe_nome">
          <input id="bebe_nome" class="inp" [value]="bebeNome()" (input)="bebeNome.set($any($event.target).value)" />
        </ui-field>
        <ui-field label="Sexo" for="bebe_sexo">
          <select id="bebe_sexo" class="inp" [value]="bebeSexo()" (change)="bebeSexo.set($any($event.target).value)">
            <option value="">Não informar</option>
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
            <option value="indeterminado">Indeterminado</option>
          </select>
        </ui-field>
      </fieldset>

      <ui-button type="submit">Continuar</ui-button>
    </form>
  `,
  styles: `form{display:flex;flex-direction:column}.toggle{display:flex;gap:.5rem;margin-bottom:1rem}.toggle button{flex:1;padding:.5rem;border:1px solid #cbd5e1;border-radius:.5rem;background:#fff;cursor:pointer;font-size:.85rem}.toggle button.on{background:#5DBB8A;color:#fff;border-color:#5DBB8A}.inp{width:100%;padding:.6rem .75rem;border:1px solid #cbd5e1;border-radius:.5rem;font-size:1rem}.bebe{border:1px solid #e2e8f0;border-radius:.5rem;padding:1rem;margin:.5rem 0 1rem}legend{font-size:.85rem;color:#64748b;padding:0 .35rem}ui-button{margin-top:.5rem}`,
})
export class GestacaoStepComponent {
  readonly completed = output<GestacaoPayload>();

  protected readonly modo = signal<'dpp' | 'semanas'>('dpp');
  protected readonly dpp = signal('');
  protected readonly semanas = signal('');
  protected readonly bebeNome = signal('');
  protected readonly bebeSexo = signal('');
  protected readonly erro = signal<string | null>(null);
  protected erroGestacao(): string | null { return this.erro(); }

  setModo(m: 'dpp' | 'semanas'): void {
    this.modo.set(m);
    this.erro.set(null);
  }

  protected onSubmit(e: Event): void {
    e.preventDefault();
    const gestacao: GestacaoPayload['gestacao'] =
      this.modo() === 'dpp' ? { dpp: this.dpp() } : { semanas: Number(this.semanas()) };

    if ((this.modo() === 'dpp' && !this.dpp()) || (this.modo() === 'semanas' && !this.semanas())) {
      this.erro.set('Informe a DPP ou as semanas de gestação');
      return;
    }

    const bebe: NonNullable<GestacaoPayload['bebe']> = {};
    if (this.bebeNome()) bebe.nome = this.bebeNome();
    if (this.bebeSexo()) bebe.sexo = this.bebeSexo() as SexoBebe;

    const payload: GestacaoPayload = { gestacao };
    if (Object.keys(bebe).length) payload.bebe = bebe;
    this.completed.emit(payload);
  }
}
```

> Nota: este passo usa **signals locais + validação manual** (não Signal Forms), porque a regra é "exatamente um entre DPP/semanas" com modo alternável e bebê condicional — mais simples e legível à mão do que esquematizar em Signal Forms. As atoms `ui-field`/`ui-button` continuam reaproveitadas. (Decisão consistente com a opção "Signals locais" disponível; aqui ela é a ferramenta certa para o caso específico, enquanto os demais forms usam Signal Forms.)

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test gestacao-step`
Expected: PASS (2 testes).

- [x] **Step 5: Commit**

```bash
git add frontend/src/app/shared/ui/organisms/gestacao-step
git commit -m "feat(frontend): organism gestacao-step (DPP ou semanas + bebê opcional) — TDD"
```

---

### Task 13: Wizard — `ConvidarStepComponent` (passo 3)

**Files:**
- Create: `frontend/src/app/shared/ui/organisms/convidar-step/convidar-step.component.ts`
- Test: `frontend/src/app/shared/ui/organisms/convidar-step/convidar-step.component.spec.ts`

**Interfaces:**
- Consumes: `ApiService.gerarConvite`, `ButtonComponent`.
- Produces: `ConvidarStepComponent` (`ui-convidar-step`): output `finished: EventEmitter<void>` (concluir/pular). Botões "Convidar parceiro(a)" e "Convidar familiar" chamam `gerarConvite({ papel })` e exibem o link copiável (`location.origin + url_relativa`) com botão "Copiar". "Concluir" emite `finished`.

- [x] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/shared/ui/organisms/convidar-step/convidar-step.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConvidarStepComponent } from './convidar-step.component';
import { ApiService } from '../../../../app/core/api/api.service';

describe('ConvidarStepComponent', () => {
  const gerarConvite = vi.fn().mockReturnValue(
    of({ token: 'tok-1', papel: 'parceiro', expira_em: '', url_relativa: '/convite/tok-1' }),
  );

  async function render() {
    await TestBed.configureTestingModule({
      imports: [ConvidarStepComponent],
      providers: [{ provide: ApiService, useValue: { gerarConvite } }],
    }).compileComponents();
    const fx = TestBed.createComponent(ConvidarStepComponent);
    fx.detectChanges();
    return fx;
  }

  beforeEach(() => gerarConvite.mockClear());

  it('gerar convite de parceiro exibe o link', async () => {
    const fx = await render();
    fx.componentInstance.gerar('parceiro');
    fx.detectChanges();
    expect(gerarConvite).toHaveBeenCalledWith({ papel: 'parceiro' });
    expect((fx.nativeElement as HTMLElement).textContent).toContain('/convite/tok-1');
  });

  it('concluir emite finished', async () => {
    const fx = await render();
    const spy = vi.fn();
    fx.componentInstance.finished.subscribe(spy);
    fx.componentInstance.concluir();
    expect(spy).toHaveBeenCalled();
  });
});
```

> Nota de import: ajuste o caminho relativo de `ApiService` no spec para `../../../../core/api/api.service` se a profundidade exigir (organisms ficam em `shared/ui/organisms/<nome>/`). O caminho correto a partir do spec é `../../../core/api/api.service` (três níveis acima de `organisms/convidar-step/` chegam a `app/`). Use o mesmo caminho do componente implementado no Step 3.

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test convidar-step`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar**

Create `frontend/src/app/shared/ui/organisms/convidar-step/convidar-step.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import type { ConviteResponse, PapelConvite } from '@crescendo/shared';
import { ApiService } from '../../../core/api/api.service';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'ui-convidar-step',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="intro">Convide quem vai acompanhar a gestação com você. Isto é opcional — você pode fazer depois.</p>
    <div class="botoes">
      <ui-button (click)="gerar('parceiro')" [loading]="loading()">Convidar parceiro(a)</ui-button>
      <ui-button (click)="gerar('familia')" [loading]="loading()">Convidar familiar</ui-button>
    </div>

    @for (l of links(); track l.token) {
      <div class="link">
        <span class="papel">{{ l.papel === 'parceiro' ? 'Parceiro(a)' : 'Familiar' }}:</span>
        <input class="url" readonly [value]="urlAbs(l)" (focus)="$any($event.target).select()" />
        <button type="button" class="copiar" (click)="copiar(urlAbs(l))">Copiar</button>
      </div>
    }

    <ui-button (click)="concluir()">Concluir</ui-button>
  `,
  styles: `.intro{color:#475569;line-height:1.5}.botoes{display:flex;gap:.75rem;margin:1rem 0}.link{display:flex;align-items:center;gap:.5rem;margin:.5rem 0}.papel{font-size:.85rem;font-weight:600;color:#334155}.url{flex:1;padding:.4rem;border:1px solid #cbd5e1;border-radius:.4rem;font-size:.8rem}.copiar{padding:.4rem .6rem;border:none;border-radius:.4rem;background:#334155;color:#fff;cursor:pointer}`,
})
export class ConvidarStepComponent {
  private readonly api = inject(ApiService);
  readonly finished = output<void>();

  readonly loading = signal(false);
  readonly links = signal<ConviteResponse[]>([]);

  gerar(papel: PapelConvite): void {
    this.loading.set(true);
    this.api.gerarConvite({ papel }).subscribe({
      next: (c) => {
        this.links.update((ls) => [...ls, c]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected urlAbs(l: ConviteResponse): string {
    return `${location.origin}${l.url_relativa}`;
  }

  protected copiar(url: string): void {
    void navigator.clipboard?.writeText(url);
  }

  concluir(): void {
    this.finished.emit();
  }
}
```

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test convidar-step`
Expected: PASS (2 testes).

- [x] **Step 5: Commit**

```bash
git add frontend/src/app/shared/ui/organisms/convidar-step
git commit -m "feat(frontend): organism convidar-step (gera link de convite + copiar) — TDD"
```

---

### Task 14: `OnboardingComponent` (container do wizard) + rota

**Files:**
- Create: `frontend/src/app/features/onboarding/onboarding.component.ts`
- Test: `frontend/src/app/features/onboarding/onboarding.component.spec.ts`
- Modify: `frontend/src/app/app.routes.ts`

**Interfaces:**
- Consumes: `PerfilStepComponent`, `GestacaoStepComponent`, `ConvidarStepComponent`, `StepperItemComponent`, `PublicLayoutComponent`, `ApiService.listarMunicipios`/`onboardingGestante`, `Router`.
- Produces: `OnboardingComponent` (`app-onboarding`) — estado do passo por signal (`passo: 1|2|3`); agrega perfil + gestação; no fim do passo 2 **envia** `POST /onboarding/gestante` (com `aceite_termos: true`, `versao_termos: 'v1'`), guarda a resposta e avança ao passo 3; o passo 3 (`finished`) navega para `/`. Carrega municípios no init.

- [x] **Step 1: Escrever o teste (que falha)**

Create `frontend/src/app/features/onboarding/onboarding.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { OnboardingComponent } from './onboarding.component';
import { ApiService } from '../../core/api/api.service';

describe('OnboardingComponent', () => {
  const listarMunicipios = vi.fn().mockReturnValue(of([{ id: 1, nome: 'Ilhéus', uf: 'BA' }]));
  const onboardingGestante = vi.fn().mockReturnValue(of({ gestacao_id: 7, convites: [] }));
  let navigate: ReturnType<typeof vi.fn>;

  async function make() {
    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: { listarMunicipios, onboardingGestante } },
      ],
    }).compileComponents();
    const fx = TestBed.createComponent(OnboardingComponent);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fx.detectChanges();
    return fx.componentInstance;
  }

  beforeEach(() => { onboardingGestante.mockClear(); });

  it('passo 1 → 2 → submit monta o request e avança ao passo 3', async () => {
    const c = await make();
    c.onPerfil({ nome: 'Ana', data_nascimento: '1995-05-05', municipio_id: 1 });
    expect(c.passo()).toBe(2);
    c.onGestacao({ gestacao: { semanas: 10 }, bebe: { nome: 'Bebê' } });
    expect(onboardingGestante).toHaveBeenCalledWith({
      perfil: { nome: 'Ana', data_nascimento: '1995-05-05', municipio_id: 1, aceite_termos: true, versao_termos: 'v1' },
      gestacao: { semanas: 10 },
      bebe: { nome: 'Bebê' },
    });
    expect(c.passo()).toBe(3);
  });

  it('concluir o passo 3 navega para /', async () => {
    const c = await make();
    c.onFinish();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test onboarding.component`
Expected: FAIL — módulo inexistente.

- [x] **Step 3: Implementar**

Create `frontend/src/app/features/onboarding/onboarding.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { MunicipioResponse, OnboardingGestanteRequest } from '@crescendo/shared';
import { ApiService } from '../../core/api/api.service';
import { PerfilStepComponent } from '../../shared/ui/organisms/perfil-step/perfil-step.component';
import { GestacaoStepComponent } from '../../shared/ui/organisms/gestacao-step/gestacao-step.component';
import { ConvidarStepComponent } from '../../shared/ui/organisms/convidar-step/convidar-step.component';
import { StepperItemComponent } from '../../shared/ui/molecules/stepper-item/stepper-item.component';
import { PublicLayoutComponent } from '../../shared/ui/templates/public-layout/public-layout.component';

type Perfil = { nome: string; data_nascimento: string; municipio_id: number };
type Gestacao = Pick<OnboardingGestanteRequest, 'gestacao' | 'bebe'>;

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    PerfilStepComponent, GestacaoStepComponent, ConvidarStepComponent,
    StepperItemComponent, PublicLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      <div class="stepper">
        <ui-stepper-item [index]="1" [active]="passo() === 1" [done]="passo() > 1" />
        <ui-stepper-item [index]="2" [active]="passo() === 2" [done]="passo() > 2" />
        <ui-stepper-item [index]="3" [active]="passo() === 3" [done]="false" />
      </div>

      @switch (passo()) {
        @case (1) {
          <h1>Seu perfil</h1>
          <ui-perfil-step [municipios]="municipios()" (completed)="onPerfil($event)" />
        }
        @case (2) {
          <h1>Sua gestação</h1>
          <ui-gestacao-step (completed)="onGestacao($event)" />
        }
        @case (3) {
          <h1>Convide quem vai com você</h1>
          <ui-convidar-step (finished)="onFinish()" />
        }
      }
    </ui-public-layout>
  `,
  styles: `.stepper{display:flex;gap:.75rem;justify-content:center;margin-bottom:1.5rem}h1{margin:0 0 1rem;font-size:1.3rem;color:#334155;text-align:center}`,
})
export class OnboardingComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly passo = signal<1 | 2 | 3>(1);
  readonly municipios = signal<MunicipioResponse[]>([]);
  private perfil: Perfil | null = null;

  ngOnInit(): void {
    this.api.listarMunicipios().subscribe((ms) => this.municipios.set(ms));
  }

  onPerfil(p: Perfil): void {
    this.perfil = p;
    this.passo.set(2);
  }

  onGestacao(g: Gestacao): void {
    const p = this.perfil!;
    const request: OnboardingGestanteRequest = {
      perfil: {
        nome: p.nome,
        data_nascimento: p.data_nascimento,
        municipio_id: p.municipio_id,
        aceite_termos: true,
        versao_termos: 'v1',
      },
      gestacao: g.gestacao,
      ...(g.bebe ? { bebe: g.bebe } : {}),
    };
    this.api.onboardingGestante(request).subscribe(() => this.passo.set(3));
  }

  onFinish(): void {
    void this.router.navigate(['/']);
  }
}
```

> Nota: o `aceite_termos`/`versao_termos` já foram consentidos no `/cadastro` (checkbox LGPD); o onboarding os reafirma como `true`/`'v1'` no payload exigido pelo contrato. O envio acontece ao concluir o passo 2 (o passo 3 de convites é opcional e a gestação já está criada — os convites do passo 3 usam o `POST /convites` canônico, não o array do onboarding).

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test onboarding.component`
Expected: PASS (2 testes).

- [x] **Step 5: Registrar a rota `/onboarding` (com `authGuard` + `onboardingGuard`)**

Modify `frontend/src/app/app.routes.ts` — adicionar os imports dos guards no topo e a rota:

```ts
import { authGuard } from './core/guards/auth.guard';
import { onboardingGuard } from './core/guards/onboarding.guard';
```

```ts
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
    canActivate: [authGuard, onboardingGuard],
  },
```

- [x] **Step 6: Commit**

```bash
git add frontend/src/app/features/onboarding frontend/src/app/app.routes.ts
git commit -m "feat(frontend): wizard de onboarding (3 passos) → POST /onboarding/gestante (TDD)"
```

---

### Task 15: `HomeComponent` (decide via `/me`) + `authGuard` na home + verificação final

**Files:**
- Modify: `frontend/src/app/features/home/home.component.ts`
- Modify: `frontend/src/app/features/home/home.component.spec.ts`
- Modify: `frontend/src/app/app.routes.ts` (`authGuard` na home)

**Interfaces:**
- Consumes: `ApiService.getMe`, `Router`.
- Produces: `HomeComponent` (`app-home`) — no init chama `GET /me`; se `!tem_onboarding` → navega `/onboarding`; senão mostra o placeholder "Crescendo Juntos" com o nome do usuário.

- [x] **Step 1: Atualizar o teste da home (que passa a falhar)**

Replace `frontend/src/app/features/home/home.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';
import { ApiService } from '../../core/api/api.service';

describe('HomeComponent', () => {
  const getMe = vi.fn();
  let navigate: ReturnType<typeof vi.fn>;

  async function make() {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), { provide: ApiService, useValue: { getMe } }],
    }).compileComponents();
    const fx = TestBed.createComponent(HomeComponent);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fx.detectChanges();
    await fx.whenStable();
    fx.detectChanges();
    return fx;
  }

  beforeEach(() => { getMe.mockReset(); });

  it('sem onboarding redireciona para /onboarding', async () => {
    getMe.mockReturnValue(of({ nome: 'Ana', tem_onboarding: false, gestacoes: [], participacoes: [] }));
    await make();
    expect(navigate).toHaveBeenCalledWith(['/onboarding']);
  });

  it('com onboarding mostra o app com o nome', async () => {
    getMe.mockReturnValue(of({ nome: 'Ana', tem_onboarding: true, gestacoes: [], participacoes: [] }));
    const fx = await make();
    expect(navigate).not.toHaveBeenCalled();
    expect((fx.nativeElement as HTMLElement).textContent).toContain('Crescendo Juntos');
    expect((fx.nativeElement as HTMLElement).textContent).toContain('Ana');
  });
});
```

- [x] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter frontend test home.component`
Expected: FAIL — a home atual não injeta `ApiService` nem redireciona.

- [x] **Step 3: Implementar**

Replace `frontend/src/app/features/home/home.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { MeResponse } from '@crescendo/shared';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="home">
      <h1>Crescendo Juntos</h1>
      @if (me(); as u) {
        <p>Olá, {{ u.nome }}! Seu acompanhamento aparecerá aqui em breve.</p>
      }
    </main>
  `,
  styles: `.home{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:2rem;text-align:center}h1{color:#5DBB8A}p{color:#475569}`,
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly me = signal<MeResponse | null>(null);

  ngOnInit(): void {
    this.api.getMe().subscribe((u) => {
      if (!u.tem_onboarding) {
        void this.router.navigate(['/onboarding']);
        return;
      }
      this.me.set(u);
    });
  }
}
```

- [x] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter frontend test home.component`
Expected: PASS (2 testes).

- [x] **Step 5: Aplicar `authGuard` na rota da home**

Modify `frontend/src/app/app.routes.ts` — a rota `''` passa a ter o guard:

```ts
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
```

- [x] **Step 6: Verificação final — build de produção + suíte completa**

Run: `pnpm --filter frontend build`
Expected: build de produção conclui sem erro (todas as rotas lazy compilam; estilos abaixo do budget).
Run: `pnpm --filter frontend test`
Expected: **toda** a suíte do frontend PASS.

- [x] **Step 7: Verificação de fluxo real (skills `run`/`verify`)**

Com o backend F1a rodando localmente (`:3000`) e um projeto Supabase de dev configurado (URL/anon key no `environment.development.ts`; Redirect URLs apontando a `/confirmar-email` e `/redefinir-senha`), exercitar: `/cadastro` → e-mail de confirmação → `/login` → `/onboarding` (perfil → gestação → convite) → `/` (home); depois abrir `/convite/:token` em outra sessão/navegador e aceitar. Conferir linhas em `usuario`/`gestacao`/`bebe`/`convite`/`participacao` no Postgres local.

> Esta verificação depende do provisionamento operacional do Supabase (spec seção 7) e do backend ativo; o código do frontend está completo e testado independentemente.

- [x] **Step 8: Commit**

```bash
git add frontend/src/app/features/home frontend/src/app/app.routes.ts
git commit -m "feat(frontend): home decide via /me (onboarding vs app) + authGuard na raiz (TDD)"
```

---

## Self-Review

**Spec coverage (seção 4 — frontend telas):**
- `/login` (guestGuard) → Tasks 3–4 ✅
- `/cadastro` (guestGuard, aceite LGPD + link termos) → Tasks 5–6 ✅
- `/termos` (texto fixo v1) → Task 7 ✅
- `/esqueci-senha` → Task 8 ✅
- `/redefinir-senha` (updatePassword) → Task 9 ✅
- `/confirmar-email` → Task 7 ✅
- `/convite/:token` (grava token em localStorage; se logado aceita direto) → Task 10 ✅ (F1-9, F1-17)
- `/onboarding` (wizard 3 passos, authGuard+onboardingGuard) → Tasks 11–14 ✅ (F1-4 bebê opcional, F1-19 convite no passo 3 via POST /convites)
- `/` home (authGuard, decide via /me) → Task 15 ✅
- Reidratação do token de convite pós-login (F1-17) → Task 2 + consumo em Tasks 4 e 10 ✅
- Atomic Design: organisms (login-form, cadastro-form, passos do wizard) em `shared/ui/organisms` (F1-12) → Tasks 3, 5, 11–13 ✅
- Vitest (F1-13) → todos os testes ✅
- Signal Forms (decisão do usuário, 2026-06-23) → Tasks 1, 3, 5, 8, 9, 11 ✅

**Placeholder scan:** sem TBD/TODO funcional; cada step traz código/comando concreto. As "Notas" são decisões conscientes, não placeholders. O texto de `/termos` v1 é placeholder de **conteúdo** (spec seção 7), não de funcionalidade. ✅

**Type consistency:**
- `PendingInviteFlowService.consumir(): Observable<boolean>` (Task 2) consumido por `LoginComponent` (Task 4) e `ConviteComponent` (Task 10). ✅
- Organisms emitem (`submitted`/`completed`/`finished`) os shapes exatos que os features consomem (`onLogin`/`onCadastro`/`onPerfil`/`onGestacao`/`onFinish`). ✅
- `OnboardingComponent.onGestacao` monta `OnboardingGestanteRequest` conforme `@crescendo/shared` (perfil + gestacao + bebe opcional). ✅
- `fieldError(field)` (Task 1) usado por todos os organisms/forms. ✅
- Diretiva `FormField` / `[formField]` e atoms `FormValueControl`/`FormCheckboxControl` (Task 1) usados por todos os forms baseados em Signal Forms. ✅

**Notas conscientes (não são placeholders):**
- O passo 2 (`gestacao-step`) usa signals locais + validação manual em vez de Signal Forms — é a ferramenta certa para a regra "exatamente um entre DPP/semanas" com modo alternável e bebê condicional; os demais forms usam Signal Forms (decisão do usuário).
- A confirmação de senha usa `validate(p.confirmar, ctx => ...)` com `ctx.valueOf(p.senha)`; se a API exata desta release diferir, o fallback `this.model().senha` é garantido (o teste de divergência detecta).
- `emailRedirectTo` do `signUp` já aponta para `/confirmar-email` (commit da F1b-1); a tela `/confirmar-email` é informativa e leva a `/login`.
- Verificação de ponta a ponta (Task 15 Step 7) depende do provisionamento operacional do Supabase e do backend F1a ativo.

---

## Execution Handoff

**Plano completo e salvo em `docs/superpowers/plans/2026-06-23-f1b2-frontend-telas.md`. Duas opções de execução:**

**1. Subagent-Driven (recomendado)** — disparo um subagente novo por task, revisão em dois estágios entre tasks.

**2. Inline Execution** — executo as tasks nesta sessão com checkpoints.

**Qual abordagem?**
