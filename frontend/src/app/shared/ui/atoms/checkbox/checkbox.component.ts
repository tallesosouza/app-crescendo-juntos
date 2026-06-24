import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import type { FormCheckboxControl } from '@angular/forms/signals';

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="chk">
      <input
        type="checkbox"
        [id]="id()"
        [checked]="checked()"
        (change)="checked.set($any($event.target).checked)"
        (blur)="touch.emit()"
      />
      <ng-content />
    </label>
  `,
  styles: `.chk{display:flex;align-items:center;gap:.5rem;font-size:.95rem}`,
})
export class CheckboxComponent implements FormCheckboxControl {
  readonly id = input<string>('');
  readonly checked = model<boolean>(false);
  readonly touch = output<void>();
}
