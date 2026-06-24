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
