import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'ui-text-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      [id]="id()"
      [type]="type()"
      [placeholder]="placeholder()"
      [value]="value()"
      (input)="value.set($any($event.target).value)"
      class="inp"
    />
  `,
  styles: `.inp{width:100%;padding:.6rem .75rem;border:1px solid #cbd5e1;border-radius:.5rem;font-size:1rem}`,
})
export class TextInputComponent {
  readonly id = input<string>('');
  readonly type = input<string>('text');
  readonly placeholder = input<string>('');
  readonly value = model<string>('');
}
