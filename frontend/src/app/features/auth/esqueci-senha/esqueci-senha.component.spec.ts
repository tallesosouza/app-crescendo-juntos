import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
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

  it('libera o loading e não mostra confirmação quando a API falha', async () => {
    esqueciSenha.mockReturnValueOnce(throwError(() => new Error('network')));
    const fx = await make();
    const input = (fx.nativeElement as HTMLElement).querySelector('#email') as HTMLInputElement;
    input.value = 'ana@ex.com';
    input.dispatchEvent(new Event('input'));
    fx.detectChanges();
    (fx.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    await fx.whenStable();
    fx.detectChanges();
    expect(fx.componentInstance.loading()).toBe(false);
    expect(fx.componentInstance.enviado()).toBe(false);
  });
});
