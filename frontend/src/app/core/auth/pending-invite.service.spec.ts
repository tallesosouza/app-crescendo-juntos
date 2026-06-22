import { TestBed } from '@angular/core/testing';
import { PendingInviteService } from './pending-invite.service';

describe('PendingInviteService', () => {
  let svc: PendingInviteService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(PendingInviteService);
  });

  it('get retorna null quando não há token', () => {
    expect(svc.get()).toBeNull();
  });

  it('set persiste e get recupera', () => {
    svc.set('tok-123');
    expect(svc.get()).toBe('tok-123');
    expect(localStorage.getItem('cj_pending_invite')).toBe('tok-123');
  });

  it('clear remove o token', () => {
    svc.set('tok-123');
    svc.clear();
    expect(svc.get()).toBeNull();
  });
});
