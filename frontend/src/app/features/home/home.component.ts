import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { MeResponse } from '@crescendo/shared';
import { ApiService } from '../../core/api/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="home">
      <h1>Crescendo Juntos</h1>
      @if (me(); as u) {
        <p>Olá, {{ u.nome }}! Seu acompanhamento aparecerá aqui em breve.</p>
      }
    </main>
  `,
  styles: `.home{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:2rem;text-align:center}h1{color:#5DBB8A}p{color:#475569}`,
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly me = signal<MeResponse | null>(null);

  ngOnInit(): void {
    this.api.getMe().subscribe({
      next: (u) => {
        if (!u.tem_onboarding) {
          void this.router.navigate(['/onboarding']);
          return;
        }
        this.me.set(u);
      },
      // 401 já é tratado pelo authInterceptor (redireciona a /login); aqui cobrimos
      // falhas residuais (500/rede) para não deixar um erro RxJS não tratado —
      // mesmo padrão de robustez adotado nas Tasks 13/14.
      error: () => {
        void this.router.navigate(['/login']);
      },
    });
  }
}
