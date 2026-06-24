import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { FieldComponent } from '../../molecules/field/field.component';
import { TextInputComponent } from '../../atoms/text-input/text-input.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { ErrorLabelComponent } from '../../atoms/error-label/error-label.component';
import { fieldError } from '../../forms/field-error';

@Component({
  selector: 'ui-login-form',
  standalone: true,
  imports: [FormField, FieldComponent, TextInputComponent, ButtonComponent, ErrorLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="onSubmit($event)" novalidate>
      <ui-field label="E-mail" for="email" [error]="err(f.email)">
        <ui-text-input [formField]="f.email" [id]="'email'" type="email" placeholder="voce@exemplo.com" />
      </ui-field>
      <ui-field label="Senha" for="senha" [error]="err(f.senha)">
        <ui-text-input [formField]="f.senha" [id]="'senha'" type="password" />
      </ui-field>
      <ui-error-label [message]="errorMsg()" />
      <ui-button type="submit" [loading]="loading()">Entrar</ui-button>
    </form>
  `,
  styles: `form{display:flex;flex-direction:column}ui-button{margin-top:.5rem}`,
})
export class LoginFormComponent {
  readonly loading = input(false);
  readonly errorMsg = input<string | null>(null);
  readonly submitted = output<{ email: string; senha: string }>();

  protected readonly err = fieldError;
  protected readonly model = signal({ email: '', senha: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.email, { message: 'Informe seu e-mail' });
    email(p.email, { message: 'E-mail inválido' });
    required(p.senha, { message: 'Informe sua senha' });
  });

  protected async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    await submit(this.f, async () => {
      this.submitted.emit({ ...this.model() });
    });
  }
}
