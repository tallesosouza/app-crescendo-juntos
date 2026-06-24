import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OnboardingComponent } from './onboarding.component';
import { ApiService } from '../../core/api/api.service';

describe('OnboardingComponent', () => {
  const listarMunicipios = vi.fn().mockReturnValue(of([{ id: 1, nome: 'Ilhéus', uf: 'BA' }]));
  const onboardingGestante = vi.fn().mockReturnValue(of({ gestacao_id: 7, convites: [] }));
  let navigate: ReturnType<typeof vi.fn>;

  async function make() {
    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: { listarMunicipios, onboardingGestante } },
      ],
    }).compileComponents();
    const fx = TestBed.createComponent(OnboardingComponent);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fx.detectChanges();
    return fx.componentInstance;
  }

  beforeEach(() => { onboardingGestante.mockClear(); });

  it('passo 1 → 2 → submit monta o request e avança ao passo 3', async () => {
    const c = await make();
    c.onPerfil({ nome: 'Ana', data_nascimento: '1995-05-05', municipio_id: 1 });
    expect(c.passo()).toBe(2);
    c.onGestacao({ gestacao: { semanas: 10 }, bebe: { nome: 'Bebê' } });
    expect(onboardingGestante).toHaveBeenCalledWith({
      perfil: { nome: 'Ana', data_nascimento: '1995-05-05', municipio_id: 1, aceite_termos: true, versao_termos: 'v1' },
      gestacao: { semanas: 10 },
      bebe: { nome: 'Bebê' },
    });
    expect(c.passo()).toBe(3);
  });

  it('concluir o passo 3 navega para /', async () => {
    const c = await make();
    c.onFinish();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('erro no envio do onboarding não deixa exceção sem tratamento e mantém o usuário no passo 2', async () => {
    onboardingGestante.mockReturnValueOnce(throwError(() => new Error('falha de rede')));
    const c = await make();
    c.onPerfil({ nome: 'Ana', data_nascimento: '1995-05-05', municipio_id: 1 });
    expect(() => c.onGestacao({ gestacao: { semanas: 10 } })).not.toThrow();
    expect(c.passo()).toBe(2);
    expect(c.erroSubmissao()).toBeTruthy();
  });
});
