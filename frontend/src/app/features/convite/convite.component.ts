import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ConsultarConviteResponse } from '@crescendo/shared';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { PendingInviteService } from '../../core/auth/pending-invite.service';
import { PendingInviteFlowService } from '../../core/convite/pending-invite-flow.service';
import { PublicLayoutComponent } from '../../shared/ui/templates/public-layout/public-layout.component';

@Component({
  selector: 'app-convite',
  standalone: true,
  imports: [PublicLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      @if (erro()) {
        <h1>Convite inválido</h1>
        <p>Este convite não existe, expirou ou já foi utilizado.</p>
        <a routerLink="/login" class="btn-link">Ir para o login</a>
      } @else if (convite(); as c) {
        <h1>Você foi convidada(o)!</h1>
        <p><strong>{{ c.nome_gestante }}</strong> convidou você para participar como <strong>{{ papelLabel(c.papel) }}</strong>.</p>
        <div class="acoes">
          <a routerLink="/login" class="btn-primary">Entrar</a>
          <a routerLink="/cadastro" class="btn-link">Criar conta</a>
        </div>
      } @else {
        <p>Carregando convite…</p>
      }
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 1rem;font-size:1.4rem;color:#334155}p{color:#475569;line-height:1.5}.acoes{display:flex;gap:1rem;align-items:center;margin-top:1.25rem}.btn-primary{background:#5DBB8A;color:#fff;padding:.6rem 1rem;border-radius:.5rem;font-weight:600;text-decoration:none}.btn-link{color:#5DBB8A;font-weight:600;text-decoration:none}`,
})
export class ConviteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly pending = inject(PendingInviteService);
  private readonly flow = inject(PendingInviteFlowService);
  private readonly router = inject(Router);

  readonly convite = signal<ConsultarConviteResponse | null>(null);
  readonly erro = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.pending.set(token);

    if (this.auth.isAuthenticated()) {
      this.flow.consumir().subscribe(() => void this.router.navigate(['/']));
      return;
    }
    this.api.consultarConvite(token).subscribe({
      next: (c) => this.convite.set(c),
      error: () => this.erro.set(true),
    });
  }

  protected papelLabel(papel: ConsultarConviteResponse['papel']): string {
    return papel === 'parceiro' ? 'parceiro(a)' : 'familiar';
  }
}
