import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ErrorLabelComponent } from '../../atoms/error-label/error-label.component';

@Component({
  selector: 'ui-field',
  standalone: true,
  imports: [ErrorLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      <label [attr.for]="for()">{{ label() }}</label>
      <ng-content />
      <ui-error-label [message]="error()" />
    </div>
  `,
  styles: `.field{display:flex;flex-direction:column;gap:.35rem;margin-bottom:1rem}label{font-size:.9rem;font-weight:600;color:#334155}`,
})
export class FieldComponent {
  readonly label = input<string>('');
  readonly for = input<string>('');
  readonly error = input<string | null>(null);
}
