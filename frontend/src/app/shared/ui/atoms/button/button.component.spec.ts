import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<ui-button [loading]="loading" [disabled]="disabled">Enviar</ui-button>`,
})
class Host {
  loading = false;
  disabled = false;
}

describe('ButtonComponent', () => {
  it('projeta o conteúdo', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).textContent).toContain('Enviar');
  });

  it('fica disabled quando loading', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    f.componentInstance.loading = true;
    f.detectChanges();
    const btn = (f.nativeElement as HTMLElement).querySelector('button')!;
    expect(btn.disabled).toBe(true);
    expect((f.nativeElement as HTMLElement).querySelector('ui-spinner')).not.toBeNull();
  });
});
