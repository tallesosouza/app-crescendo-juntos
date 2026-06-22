import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button [type]="type()" [disabled]="disabled() || loading()" class="btn">
      @if (loading()) {<ui-spinner />} <ng-content />
    </button>
  `,
  styles: `.btn{display:inline-flex;align-items:center;gap:.4rem;padding:.6rem 1rem;border:none;border-radius:.5rem;background:#5DBB8A;color:#fff;font-weight:600;cursor:pointer}.btn:disabled{opacity:.6;cursor:not-allowed}`,
})
export class ButtonComponent {
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
}
