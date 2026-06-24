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
