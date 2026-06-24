import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import type { MunicipioResponse } from '@crescendo/shared';
import { FieldComponent } from '../../molecules/field/field.component';
import { TextInputComponent } from '../../atoms/text-input/text-input.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { fieldError } from '../../forms/field-error';

@Component({
  selector: 'ui-perfil-step',
  standalone: true,
  imports: [FormField, FieldComponent, TextInputComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="onSubmit($event)" novalidate>
      <ui-field label="Seu nome" for="nome" [error]="err(f.nome)">
        <ui-text-input [formField]="f.nome" [id]="'nome'" />
      </ui-field>
      <ui-field label="Data de nascimento" for="data_nascimento" [error]="err(f.data_nascimento)">
        <ui-text-input [formField]="f.data_nascimento" [id]="'data_nascimento'" type="date" />
      </ui-field>
      <ui-field label="Município" for="municipio" [error]="err(f.municipio_id)">
        <select [formField]="f.municipio_id" id="municipio" class="sel" (change)="onMunicipioChange($event)">
          <option value="">Selecione…</option>
          @for (m of municipios(); track m.id) {
            <option [value]="m.id">{{ m.nome }} — {{ m.uf }}</option>
          }
        </select>
      </ui-field>
      <ui-button type="submit">Continuar</ui-button>
    </form>
  `,
  styles: `form{display:flex;flex-direction:column}.sel{width:100%;padding:.6rem .75rem;border:1px solid #cbd5e1;border-radius:.5rem;font-size:1rem;background:#fff}ui-button{margin-top:.5rem}`,
})
export class PerfilStepComponent {
  readonly municipios = input<MunicipioResponse[]>([]);
  readonly completed = output<{ nome: string; data_nascimento: string; municipio_id: number }>();

  protected readonly err = fieldError;
  protected readonly model = signal({ nome: '', data_nascimento: '', municipio_id: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.nome, { message: 'Informe seu nome' });
    required(p.data_nascimento, { message: 'Informe sua data de nascimento' });
    required(p.municipio_id, { message: 'Selecione um município' });
  });

  protected onMunicipioChange(e: Event): void {
    const value = (e.target as HTMLSelectElement).value;
    this.model.update((v) => ({ ...v, municipio_id: value }));
  }

  protected async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    await submit(this.f, async () => {
      const v = this.model();
      this.completed.emit({ nome: v.nome, data_nascimento: v.data_nascimento, municipio_id: Number(v.municipio_id) });
    });
  }
}
