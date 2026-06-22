import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-error-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (message()) {<span class="erro" role="alert">{{ message() }}</span>}`,
  styles: `.erro{color:#c0392b;font-size:.85rem}`,
})
export class ErrorLabelComponent {
  readonly message = input<string | null>(null);
}
