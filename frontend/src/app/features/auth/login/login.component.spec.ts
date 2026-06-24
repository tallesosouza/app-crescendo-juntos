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
