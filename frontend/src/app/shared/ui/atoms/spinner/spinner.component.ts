import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="spinner" aria-hidden="true"></span>`,
  styles: `.spinner{display:inline-block;width:1em;height:1em;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin .6s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`,
})
export class SpinnerComponent {}
