import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CadastroFormComponent } from '../../../shared/ui/organisms/cadastro-form/cadastro-form.component';
import { PublicLayoutComponent } from '../../../shared/ui/templates/public-layout/public-layout.component';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CadastroFormComponent, PublicLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      <h1>Criar conta</h1>
      <ui-cadastro-form [loading]="loading()" [errorMsg]="errorMsg()" (submitted)="onCadastro($event)" />
      <p class="links">Já tem conta? <a routerLink="/login">Entrar</a></p>
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 1rem;font-size:1.4rem;color:#334155}.links{margin-top:1rem;font-size:.9rem}a{color:#5DBB8A;text-decoration:none}`,
})
export class CadastroComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  async onCadastro({ nome, email, senha }: { nome: string; email: string; senha: string }): Promise<void> {
    this.loading.set(true);
    this.errorMsg.set(null);
    const { error } = await this.auth.signUp(nome, email, senha);
    this.loading.set(false);
    if (error) {
      this.errorMsg.set('Não foi possível criar a conta. Verifique os dados ou tente outro e-mail.');
      return;
    }
    void this.router.navigate(['/confirmar-email']);
  }
}
