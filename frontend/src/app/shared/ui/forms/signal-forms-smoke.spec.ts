import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, required, FormField } from '@angular/forms/signals';
import { TextInputComponent } from '../atoms/text-input/text-input.component';
import { fieldError } from './field-error';

@Component({
  standalone: true,
  imports: [TextInputComponent, FormField],
  template: `
    <ui-text-input [formField]="f.nome" id="nome" />
    <span class="err">{{ fieldError(f.nome) }}</span>
  `,
})
class Host {
  protected readonly model = signal({ nome: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.nome, { message: 'Obrigatório' });
  });
  protected readonly fieldError = fieldError;
}

describe('Signal Forms ↔ atoms (smoke)', () => {
  it('digitar no ui-text-input atualiza o valor do form', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fx = TestBed.createComponent(Host);
    fx.detectChanges();
    const input = (fx.nativeElement as HTMLElement).querySelector('input')!;
    input.value = 'Ana';
    input.dispatchEvent(new Event('input'));
    fx.detectChanges();
    expect((fx.componentInstance as never as { model: () => { nome: string } }).model().nome).toBe('Ana');
  });

  it('fieldError só aparece após touched (blur)', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fx = TestBed.createComponent(Host);
    fx.detectChanges();
    expect((fx.nativeElement as HTMLElement).querySelector('.err')!.textContent!.trim()).toBe('');
    const input = (fx.nativeElement as HTMLElement).querySelector('input')!;
    input.dispatchEvent(new Event('blur'));
    fx.detectChanges();
    expect((fx.nativeElement as HTMLElement).querySelector('.err')!.textContent).toContain('Obrigatório');
  });
});
