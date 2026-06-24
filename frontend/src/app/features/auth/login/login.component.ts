import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { PendingInviteFlowService } from '../../../core/convite/pending-invite-flow.service';
import { LoginFormComponent } from '../../../shared/ui/organisms/login-form/login-form.component';
import { PublicLayoutComponent } from '../../../shared/ui/templates/public-layout/public-layout.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LoginFormComponent, PublicLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      <h1>Entrar</h1>
      <ui-login-form [loading]="loading()" [errorMsg]="errorMsg()" (submitted)="onLogin($event)" />
      <nav class="links">
        <a routerLink="/esqueci-senha">Esqueci minha senha</a>
        <a routerLink="/cadastro">Criar conta</a>
      </nav>
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 1rem;font-size:1.4rem;color:#334155}.links{display:flex;justify-content:space-between;margin-top:1rem;font-size:.9rem}a{color:#5DBB8A;text-decoration:none}`,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly invites = inject(PendingInviteFlowService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  async onLogin({ email, senha }: { email: string; senha: string }): Promise<void> {
    this.loading.set(true);
    this.errorMsg.set(null);
    const { error } = await this.auth.signIn(email, senha);
    if (error) {
      this.errorMsg.set('E-mail ou senha inválidos.');
      this.loading.set(false);
      return;
    }
    await firstValueFrom(this.invites.consumir());
    this.loading.set(false);
    void this.router.navigate(['/']);
  }
}
