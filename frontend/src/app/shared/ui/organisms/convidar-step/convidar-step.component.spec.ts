import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConvidarStepComponent } from './convidar-step.component';
import { ApiService } from '../../../../core/api/api.service';

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
