import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import type { SexoBebe } from '@crescendo/shared';
import { FieldComponent } from '../../molecules/field/field.component';
import { ButtonComponent } from '../../atoms/button/button.component';

type GestacaoPayload = {
  gestacao: { dpp?: string; semanas?: number };
  bebe?: { nome?: string; sexo?: SexoBebe; data_nascimento?: string };
};

@Component({
  selector: 'ui-gestacao-step',
  standalone: true,
  imports: [FieldComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="onSubmit($event)" novalidate>
      <div class="toggle">
        <button type="button" [class.on]="modo() === 'dpp'" (click)="setModo('dpp')">Sei a data provável (DPP)</button>
        <button type="button" [class.on]="modo() === 'semanas'" (click)="setModo('semanas')">Estou em X semanas</button>
      </div>

      @if (modo() === 'dpp') {
        <ui-field label="Data provável do parto" for="dpp" [error]="erroGestacao()">
          <input id="dpp" type="date" class="inp" [value]="dpp()" (input)="dpp.set($any($event.target).value)" />
        </ui-field>
      } @else {
        <ui-field label="Semanas de gestação" for="semanas" [error]="erroGestacao()">
          <input id="semanas" type="number" min="1" max="42" class="inp" [value]="semanas()" (input)="semanas.set($any($event.target).value)" />
        </ui-field>
      }

      <fieldset class="bebe">
        <legend>Sobre o bebê (opcional)</legend>
        <ui-field label="Nome ou apelido" for="bebe_nome">
          <input id="bebe_nome" class="inp" [value]="bebeNome()" (input)="bebeNome.set($any($event.target).value)" />
        </ui-field>
        <ui-field label="Sexo" for="bebe_sexo">
          <select id="bebe_sexo" class="inp" [value]="bebeSexo()" (change)="bebeSexo.set($any($event.target).value)">
            <option value="">Não informar</option>
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
            <option value="indeterminado">Indeterminado</option>
          </select>
        </ui-field>
      </fieldset>

      <ui-button type="submit">Continuar</ui-button>
    </form>
  `,
  styles: `form{display:flex;flex-direction:column}.toggle{display:flex;gap:.5rem;margin-bottom:1rem}.toggle button{flex:1;padding:.5rem;border:1px solid #cbd5e1;border-radius:.5rem;background:#fff;cursor:pointer;font-size:.85rem}.toggle button.on{background:#5DBB8A;color:#fff;border-color:#5DBB8A}.inp{width:100%;padding:.6rem .75rem;border:1px solid #cbd5e1;border-radius:.5rem;font-size:1rem}.bebe{border:1px solid #e2e8f0;border-radius:.5rem;padding:1rem;margin:.5rem 0 1rem}legend{font-size:.85rem;color:#64748b;padding:0 .35rem}ui-button{margin-top:.5rem}`,
})
export class GestacaoStepComponent {
  readonly completed = output<GestacaoPayload>();

  protected readonly modo = signal<'dpp' | 'semanas'>('dpp');
  protected readonly dpp = signal('');
  protected readonly semanas = signal('');
  protected readonly bebeNome = signal('');
  protected readonly bebeSexo = signal('');
  protected readonly erro = signal<string | null>(null);
  protected erroGestacao(): string | null { return this.erro(); }

  setModo(m: 'dpp' | 'semanas'): void {
    this.modo.set(m);
    this.erro.set(null);
  }

  protected onSubmit(e: Event): void {
    e.preventDefault();
    const gestacao: GestacaoPayload['gestacao'] =
      this.modo() === 'dpp' ? { dpp: this.dpp() } : { semanas: Number(this.semanas()) };

    if ((this.modo() === 'dpp' && !this.dpp()) || (this.modo() === 'semanas' && !this.semanas())) {
      this.erro.set('Informe a DPP ou as semanas de gestação');
      return;
    }

    const bebe: NonNullable<GestacaoPayload['bebe']> = {};
    if (this.bebeNome()) bebe.nome = this.bebeNome();
    if (this.bebeSexo()) bebe.sexo = this.bebeSexo() as SexoBebe;

    const payload: GestacaoPayload = { gestacao };
    if (Object.keys(bebe).length) payload.bebe = bebe;
    this.completed.emit(payload);
  }
}
