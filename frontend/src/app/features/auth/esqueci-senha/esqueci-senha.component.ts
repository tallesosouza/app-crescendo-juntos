import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { ApiService } from '../../../core/api/api.service';
import { FieldComponent } from '../../../shared/ui/molecules/field/field.component';
import { TextInputComponent } from '../../../shared/ui/atoms/text-input/text-input.component';
import { ButtonComponent } from '../../../shared/ui/atoms/button/button.component';
import { PublicLayoutComponent } from '../../../shared/ui/templates/public-layout/public-layout.component';
import { fieldError } from '../../../shared/ui/forms/field-error';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [FormField, RouterLink, FieldComponent, TextInputComponent, ButtonComponent, PublicLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      @if (enviado()) {
        <h1>Verifique seu e-mail</h1>
        <p>Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.</p>
        <a routerLink="/login" class="btn-link">Voltar ao login</a>
      } @else {
        <h1>Esqueci minha senha</h1>
        <form (submit)="onSubmit($event)" novalidate>
          <ui-field label="E-mail" for="email" [error]="err(f.email)">
            <ui-text-input [formField]="f.email" [id]="'email'" type="email" />
          </ui-field>
          <ui-button type="submit" [loading]="loading()">Enviar link</ui-button>
        </form>
      }
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 1rem;font-size:1.4rem;color:#334155}p{color:#475569;line-height:1.5}.btn-link{display:inline-block;margin-top:1rem;color:#5DBB8A;font-weight:600;text-decoration:none}`,
})
export class EsqueciSenhaComponent {
  private readonly api = inject(ApiService);

  protected readonly err = fieldError;
  readonly loading = signal(false);
  readonly enviado = signal(false);
  protected readonly model = signal({ email: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.email, { message: 'Informe seu e-mail' });
    email(p.email, { message: 'E-mail inválido' });
  });

  protected async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    await submit(this.f, async () => {
      this.loading.set(true);
      await firstValueFrom(this.api.esqueciSenha({ email: this.model().email }));
      this.loading.set(false);
      this.enviado.set(true);
    });
  }
}
