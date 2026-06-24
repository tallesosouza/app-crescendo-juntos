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
