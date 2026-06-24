import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import type { ConviteResponse, PapelConvite } from '@crescendo/shared';
import { ApiService } from '../../../../core/api/api.service';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'ui-convidar-step',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="intro">Convide quem vai acompanhar a gestação com você. Isto é opcional — você pode fazer depois.</p>
    <div class="botoes">
      <ui-button (click)="gerar('parceiro')" [loading]="loading()">Convidar parceiro(a)</ui-button>
      <ui-button (click)="gerar('familia')" [loading]="loading()">Convidar familiar</ui-button>
    </div>

    @for (l of links(); track l.token) {
      <div class="link">
        <span class="papel">{{ l.papel === 'parceiro' ? 'Parceiro(a)' : 'Familiar' }}:</span>
        <input class="url" readonly [value]="urlAbs(l)" (focus)="$any($event.target).select()" />
        <button type="button" class="copiar" (click)="copiar(urlAbs(l))">Copiar</button>
      </div>
    }

    @if (erro()) {
      <p class="erro" role="alert">{{ erro() }}</p>
    }

    <ui-button (click)="concluir()">Concluir</ui-button>
  `,
  styles: `.intro{color:#475569;line-height:1.5}.botoes{display:flex;gap:.75rem;margin:1rem 0}.link{display:flex;align-items:center;gap:.5rem;margin:.5rem 0}.papel{font-size:.85rem;font-weight:600;color:#334155}.url{flex:1;padding:.4rem;border:1px solid #cbd5e1;border-radius:.4rem;font-size:.8rem}.copiar{padding:.4rem .6rem;border:none;border-radius:.4rem;background:#334155;color:#fff;cursor:pointer}.erro{color:#b91c1c;font-size:.85rem}`,
})
export class ConvidarStepComponent {
  private readonly api = inject(ApiService);
  readonly finished = output<void>();

  readonly loading = signal(false);
  readonly links = signal<ConviteResponse[]>([]);
  protected readonly erro = signal<string | null>(null);

  gerar(papel: PapelConvite): void {
    this.loading.set(true);
    this.erro.set(null);
    this.api.gerarConvite({ papel }).subscribe({
      next: (c) => {
        this.links.update((ls) => [...ls, c]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.erro.set('Não foi possível gerar o convite. Tente novamente.');
      },
    });
  }

  protected urlAbs(l: ConviteResponse): string {
    return `${location.origin}${l.url_relativa}`;
  }

  protected copiar(url: string): void {
    void navigator.clipboard?.writeText(url);
  }

  concluir(): void {
    this.finished.emit();
  }
}
