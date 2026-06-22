import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent } from '../../molecules/card/card.component';

@Component({
  selector: 'ui-public-layout',
  standalone: true,
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="wrap">
      <ui-card><ng-content /></ui-card>
    </main>
  `,
  styles: `.wrap{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:#f1f5f9}ui-card{width:100%;max-width:26rem}`,
})
export class PublicLayoutComponent {}
