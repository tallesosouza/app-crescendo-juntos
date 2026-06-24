import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicLayoutComponent } from '../../../shared/ui/templates/public-layout/public-layout.component';

@Component({
  selector: 'app-confirmar-email',
  standalone: true,
  imports: [PublicLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      <h1>Confirme seu e-mail</h1>
      <p>Enviamos um link de confirmação para o seu e-mail. Abra-o para ativar sua conta e depois faça login.</p>
      <a routerLink="/login" class="btn-link">Ir para o login</a>
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 1rem;font-size:1.4rem;color:#334155}p{color:#475569;line-height:1.5}.btn-link{display:inline-block;margin-top:1rem;color:#5DBB8A;font-weight:600;text-decoration:none}`,
})
export class ConfirmarEmailComponent {}
