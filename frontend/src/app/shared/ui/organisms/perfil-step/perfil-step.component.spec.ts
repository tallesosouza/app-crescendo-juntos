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
