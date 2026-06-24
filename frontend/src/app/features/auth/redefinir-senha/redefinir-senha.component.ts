import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, minLength, required, submit, validate } from '@angular/forms/signals';
import { AuthService } from '../../../core/auth/auth.service';
import { FieldComponent } from '../../../shared/ui/molecules/field/field.component';
import { TextInputComponent } from '../../../shared/ui/atoms/text-input/text-input.component';
import { ButtonComponent } from '../../../shared/ui/atoms/button/button.component';
import { ErrorLabelComponent } from '../../../shared/ui/atoms/error-label/error-label.component';
import { PublicLayoutComponent } from '../../../shared/ui/templates/public-layout/public-layout.component';
import { fieldError } from '../../../shared/ui/forms/field-error';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [FormField, FieldComponent, TextInputComponent, ButtonComponent, ErrorLabelComponent, PublicLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      <h1>Definir nova senha</h1>
      <form (submit)="onSubmit($event)" novalidate>
        <ui-field label="Nova senha" for="senha" [error]="err(f.senha)">
          <ui-text-input [formField]="f.senha" [id]="'senha'" type="password" />
        </ui-field>
        <ui-field label="Confirmar senha" for="confirmar" [error]="err(f.confirmar)">
          <ui-text-input [formField]="f.confirmar" [id]="'confirmar'" type="password" />
        </ui-field>
        <ui-error-label [message]="errorMsg()" />
        <ui-button type="submit" [loading]="loading()">Salvar nova senha</ui-button>
      </form>
    </ui-public-layout>
  `,
  styles: `h1{margin:0 0 1rem;font-size:1.4rem;color:#334155}form{display:flex;flex-direction:column}ui-button{margin-top:.5rem}`,
})
export class RedefinirSenhaComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly err = fieldError;
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  protected readonly model = signal({ senha: '', confirmar: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.senha, { message: 'Informe uma senha' });
    minLength(p.senha, 8, { message: 'Mínimo de 8 caracteres' });
    validate(p.confirmar, (ctx) =>
      ctx.value() !== ctx.valueOf(p.senha) ? { kind: 'mismatch', message: 'As senhas não coincidem' } : null,
    );
  });

  protected async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    await submit(this.f, async () => {
      this.loading.set(true);
      this.errorMsg.set(null);
      try {
        const { error } = await this.auth.updatePassword(this.model().senha);
        if (error) {
          this.errorMsg.set('Não foi possível redefinir a senha. O link pode ter expirado — solicite outro.');
          return;
        }
        void this.router.navigate(['/login']);
      } catch {
        this.errorMsg.set('Não foi possível redefinir a senha. O link pode ter expirado — solicite outro.');
      } finally {
        this.loading.set(false);
      }
    });
  }
}
