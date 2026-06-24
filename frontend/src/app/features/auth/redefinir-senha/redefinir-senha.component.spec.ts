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
