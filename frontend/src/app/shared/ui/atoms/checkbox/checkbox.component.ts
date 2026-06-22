import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="chk">
      <input type="checkbox" [id]="id()" [checked]="checked()" (change)="checked.set($any($event.target).checked)" />
      <ng-content />
    </label>
  `,
  styles: `.chk{display:flex;align-items:center;gap:.5rem;font-size:.95rem}`,
})
export class CheckboxComponent {
  readonly id = input<string>('');
  readonly checked = model<boolean>(false);
}
