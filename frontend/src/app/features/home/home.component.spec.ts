import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';
import { ApiService } from '../../core/api/api.service';

describe('HomeComponent', () => {
  const getMe = vi.fn();
  let navigate: ReturnType<typeof vi.fn>;

  async function make() {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), { provide: ApiService, useValue: { getMe } }],
    }).compileComponents();
    const fx = TestBed.createComponent(HomeComponent);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fx.detectChanges();
    await fx.whenStable();
    fx.detectChanges();
    return fx;
  }

  beforeEach(() => { getMe.mockReset(); });

  it('sem onboarding redireciona para /onboarding', async () => {
    getMe.mockReturnValue(of({ nome: 'Ana', tem_onboarding: false, gestacoes: [], participacoes: [] }));
    await make();
    expect(navigate).toHaveBeenCalledWith(['/onboarding']);
  });

  it('com onboarding mostra o app com o nome', async () => {
    getMe.mockReturnValue(of({ nome: 'Ana', tem_onboarding: true, gestacoes: [], participacoes: [] }));
    const fx = await make();
    expect(navigate).not.toHaveBeenCalled();
    expect((fx.nativeElement as HTMLElement).textContent).toContain('Crescendo Juntos');
    expect((fx.nativeElement as HTMLElement).textContent).toContain('Ana');
  });
});
