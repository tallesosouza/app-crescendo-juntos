import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="card"><ng-content /></div>`,
  styles: `.card{background:#fff;border-radius:1rem;box-shadow:0 4px 20px rgba(0,0,0,.08);padding:2rem}`,
})
export class CardComponent {}
