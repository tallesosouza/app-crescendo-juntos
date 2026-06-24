import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PendingInviteFlowService } from './pending-invite-flow.service';
import { PendingInviteService } from '../auth/pending-invite.service';
import { ApiService } from '../api/api.service';

describe('PendingInviteFlowService', () => {
  const aceitarConvite = vi.fn();
  const clear = vi.fn();
  let get: () => string | null;

  function setup(token: string | null, ok = true) {
    get = () => token;
    aceitarConvite.mockReturnValue(ok ? of({ gestacao_id: 1, papel: 'parceiro' }) : throwError(() => new Error('x')));
    TestBed.configureTestingModule({
      providers: [
        { provide: PendingInviteService, useValue: { get: () => get(), clear } },
        { provide: ApiService, useValue: { aceitarConvite } },
      ],
    });
    return TestBed.inject(PendingInviteFlowService);
  }

  beforeEach(() => {
    aceitarConvite.mockClear();
    clear.mockClear();
  });

  it('sem token pendente: emite false e não chama a API', async () => {
    const svc = setup(null);
    const r = await firstValueFrom(svc.consumir());
    expect(r).toBe(false);
    expect(aceitarConvite).not.toHaveBeenCalled();
  });

  it('com token: aceita, limpa e emite true', async () => {
    const svc = setup('tok-9');
    const r = await firstValueFrom(svc.consumir());
    expect(aceitarConvite).toHaveBeenCalledWith('tok-9');
    expect(clear).toHaveBeenCalled();
    expect(r).toBe(true);
  });

  it('erro ao aceitar: limpa mesmo assim e emite false', async () => {
    const svc = setup('tok-9', false);
    const r = await firstValueFrom(svc.consumir());
    expect(clear).toHaveBeenCalled();
    expect(r).toBe(false);
  });
});
