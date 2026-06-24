import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { email, form, FormField, minLength, required, submit, validate } from '@angular/forms/signals';
import { FieldComponent } from '../../molecules/field/field.component';
import { TextInputComponent } from '../../atoms/text-input/text-input.component';
import { CheckboxComponent } from '../../atoms/checkbox/checkbox.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { ErrorLabelComponent } from '../../atoms/error-label/error-label.component';
import { fieldError } from '../../forms/field-error';

@Component({
  selector: 'ui-cadastro-form',
  standalone: true,
  imports: [FormField, RouterLink, FieldComponent, TextInputComponent, CheckboxComponent, ButtonComponent, ErrorLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="onSubmit($event)" novalidate>
      <ui-field label="Nome" for="nome" [error]="err(f.nome)">
        <ui-text-input [formField]="f.nome" [id]="'nome'" />
      </ui-field>
      <ui-field label="E-mail" for="email" [error]="err(f.email)">
        <ui-text-input [formField]="f.email" [id]="'email'" type="email" />
      </ui-field>
      <ui-field label="Senha" for="senha" [error]="err(f.senha)">
        <ui-text-input [formField]="f.senha" [id]="'senha'" type="password" />
      </ui-field>
      <ui-field label="Confirmar senha" for="confirmar" [error]="err(f.confirmar)">
        <ui-text-input [formField]="f.confirmar" [id]="'confirmar'" type="password" />
      </ui-field>
      <ui-checkbox [formField]="f.aceite" [id]="'aceite'">
        Li e aceito os <a routerLink="/termos">termos e a política de privacidade</a>
      </ui-checkbox>
      <ui-error-label [message]="err(f.aceite)" />
      <ui-error-label [message]="errorMsg()" />
      <ui-button type="submit" [loading]="loading()">Criar conta</ui-button>
    </form>
  `,
  styles: `form{display:flex;flex-direction:column}ui-button{margin-top:.75rem}a{color:#5DBB8A}`,
})
export class CadastroFormComponent {
  readonly loading = input(false);
  readonly errorMsg = input<string | null>(null);
  readonly submitted = output<{ nome: string; email: string; senha: string }>();

  protected readonly err = fieldError;
  protected readonly model = signal({ nome: '', email: '', senha: '', confirmar: '', aceite: false });
  protected readonly f = form(this.model, (p) => {
    required(p.nome, { message: 'Informe seu nome' });
    required(p.email, { message: 'Informe seu e-mail' });
    email(p.email, { message: 'E-mail inválido' });
    required(p.senha, { message: 'Informe uma senha' });
    minLength(p.senha, 8, { message: 'Mínimo de 8 caracteres' });
    validate(p.confirmar, (ctx) =>
      ctx.value() !== ctx.valueOf(p.senha) ? { kind: 'mismatch', message: 'As senhas não coincidem' } : null,
    );
    required(p.aceite, { message: 'É necessário aceitar os termos' });
  });

  protected async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    await submit(this.f, async () => {
      const { nome, email: mail, senha } = this.model();
      this.submitted.emit({ nome, email: mail, senha });
    });
  }
}
