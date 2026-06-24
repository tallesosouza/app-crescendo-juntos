import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { ConviteComponent } from './convite.component';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { PendingInviteService } from '../../core/auth/pending-invite.service';
import { PendingInviteFlowService } from '../../core/convite/pending-invite-flow.service';

describe('ConviteComponent', () => {
  const set = vi.fn();
  const consultarConvite = vi.fn().mockReturnValue(of({ papel: 'parceiro', nome_gestante: 'Ana' }));
  const consumir = vi.fn().mockReturnValue(of(true));
  let navigate: ReturnType<typeof vi.fn>;

  async function make(authed: boolean) {
    await TestBed.configureTestingModule({
      imports: [ConviteComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'tok-7' } } } },
        { provide: PendingInviteService, useValue: { set } },
        { provide: ApiService, useValue: { consultarConvite } },
        { provide: AuthService, useValue: { isAuthenticated: () => authed } },
        { provide: PendingInviteFlowService, useValue: { consumir } },
      ],
    }).compileComponents();
    const fx = TestBed.createComponent(ConviteComponent);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fx.detectChanges();
    await fx.whenStable();
    return fx;
  }

  beforeEach(() => { set.mockClear(); consultarConvite.mockClear(); consumir.mockClear(); });

  it('grava o token e, se autenticado, consome e vai para /', async () => {
    await make(true);
    expect(set).toHaveBeenCalledWith('tok-7');
    expect(consumir).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('não autenticado: grava o token, consulta e mostra o convite', async () => {
    const fx = await make(false);
    expect(set).toHaveBeenCalledWith('tok-7');
    expect(consultarConvite).toHaveBeenCalledWith('tok-7');
    expect(consumir).not.toHaveBeenCalled();
    expect((fx.nativeElement as HTMLElement).textContent).toContain('Ana');
  });
});
