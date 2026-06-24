import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { MunicipioResponse, OnboardingGestanteRequest } from '@crescendo/shared';
import { ApiService } from '../../core/api/api.service';
import { PerfilStepComponent } from '../../shared/ui/organisms/perfil-step/perfil-step.component';
import { GestacaoStepComponent } from '../../shared/ui/organisms/gestacao-step/gestacao-step.component';
import { ConvidarStepComponent } from '../../shared/ui/organisms/convidar-step/convidar-step.component';
import { StepperItemComponent } from '../../shared/ui/molecules/stepper-item/stepper-item.component';
import { PublicLayoutComponent } from '../../shared/ui/templates/public-layout/public-layout.component';

type Perfil = { nome: string; data_nascimento: string; municipio_id: number };
type Gestacao = Pick<OnboardingGestanteRequest, 'gestacao' | 'bebe'>;

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    PerfilStepComponent, GestacaoStepComponent, ConvidarStepComponent,
    StepperItemComponent, PublicLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-public-layout>
      <div class="stepper">
        <ui-stepper-item [index]="1" [active]="passo() === 1" [done]="passo() > 1" />
        <ui-stepper-item [index]="2" [active]="passo() === 2" [done]="passo() > 2" />
        <ui-stepper-item [index]="3" [active]="passo() === 3" [done]="false" />
      </div>

      @switch (passo()) {
        @case (1) {
          <h1>Seu perfil</h1>
          <ui-perfil-step [municipios]="municipios()" (completed)="onPerfil($event)" />
        }
        @case (2) {
          <h1>Sua gestação</h1>
          @if (erroSubmissao()) {
            <p class="erro" role="alert">{{ erroSubmissao() }}</p>
          }
          <ui-gestacao-step (completed)="onGestacao($event)" />
        }
        @case (3) {
          <h1>Convide quem vai com você</h1>
          <ui-convidar-step (finished)="onFinish()" />
        }
      }
    </ui-public-layout>
  `,
  styles: `.stepper{display:flex;gap:.75rem;justify-content:center;margin-bottom:1.5rem}h1{margin:0 0 1rem;font-size:1.3rem;color:#334155;text-align:center}.erro{color:#b91c1c;font-size:.85rem;margin-bottom:1rem}`,
})
export class OnboardingComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly passo = signal<1 | 2 | 3>(1);
  readonly municipios = signal<MunicipioResponse[]>([]);
  readonly erroSubmissao = signal<string | null>(null);
  private perfil: Perfil | null = null;

  ngOnInit(): void {
    this.api.listarMunicipios().subscribe((ms) => this.municipios.set(ms));
  }

  onPerfil(p: Perfil): void {
    this.perfil = p;
    this.passo.set(2);
  }

  onGestacao(g: Gestacao): void {
    const p = this.perfil!;
    const request: OnboardingGestanteRequest = {
      perfil: {
        nome: p.nome,
        data_nascimento: p.data_nascimento,
        municipio_id: p.municipio_id,
        aceite_termos: true,
        versao_termos: 'v1',
      },
      gestacao: g.gestacao,
      ...(g.bebe ? { bebe: g.bebe } : {}),
    };
    this.erroSubmissao.set(null);
    this.api.onboardingGestante(request).subscribe({
      next: () => this.passo.set(3),
      error: () => {
        this.erroSubmissao.set('Não foi possível concluir o cadastro da gestação. Tente novamente.');
      },
    });
  }

  onFinish(): void {
    void this.router.navigate(['/']);
  }
}
