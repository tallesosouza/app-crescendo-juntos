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
