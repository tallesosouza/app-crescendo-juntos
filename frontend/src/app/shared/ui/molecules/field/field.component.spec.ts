import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FieldComponent } from './field.component';

@Component({
  standalone: true,
  imports: [FieldComponent],
  template: `<ui-field label="E-mail" [error]="error"><input id="email" /></ui-field>`,
})
class Host {
  error: string | null = null;
}

describe('FieldComponent', () => {
  it('renderiza o label e projeta o controle', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('label')!.textContent).toContain('E-mail');
    expect(el.querySelector('input#email')).not.toBeNull();
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  it('mostra o erro quando presente', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    f.componentInstance.error = 'Campo obrigatório';
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).querySelector('[role="alert"]')!.textContent).toContain('Campo obrigatório');
  });
});
