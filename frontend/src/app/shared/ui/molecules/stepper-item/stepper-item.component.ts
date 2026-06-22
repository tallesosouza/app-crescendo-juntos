import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-stepper-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="step" [class.active]="active()" [class.done]="done()">
      {{ done() ? '✓' : index() }}
    </span>
  `,
  styles: `.step{display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:50%;background:#e2e8f0;color:#475569;font-weight:700}.active{background:#5DBB8A;color:#fff}.done{background:#2f855a;color:#fff}`,
})
export class StepperItemComponent {
  readonly index = input<number>(1);
  readonly active = input<boolean>(false);
  readonly done = input<boolean>(false);
}
