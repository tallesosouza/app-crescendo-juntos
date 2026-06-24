import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicLayoutComponent } from '../../../shared/ui/templates/public-layout/public-layout.component';

@Component({
  selector: 'app-termos',
  standalone: true,
  imports: [PublicLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      <h1>Termos de Uso e Política de Privacidade</h1>
      <p class="versao">Versão v1</p>
      <p>
        Ao usar o Crescendo Juntos, você concorda com o tratamento dos seus dados pessoais conforme a LGPD,
        exclusivamente para o acompanhamento da gestação e o compartilhamento com as pessoas que você convidar.
        Você pode revogar o consentimento e solicitar a exclusão dos seus dados a qualquer momento.
      </p>
      <p>Este é um texto provisório (v1), sujeito a revisão jurídica antes do lançamento.</p>
      <a routerLink="/cadastro" class="btn-link">Voltar ao cadastro</a>
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 .5rem;font-size:1.3rem;color:#334155}.versao{color:#94a3b8;font-size:.85rem;margin:0 0 1rem}p{color:#475569;line-height:1.5}.btn-link{display:inline-block;margin-top:1rem;color:#5DBB8A;font-weight:600;text-decoration:none}`,
})
export class TermosComponent {}
