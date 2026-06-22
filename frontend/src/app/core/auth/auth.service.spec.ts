import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { SUPABASE_CLIENT } from './supabase-client';

function fakeSupabase() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  };
}

describe('AuthService', () => {
  let supa: ReturnType<typeof fakeSupabase>;

  function make() {
    supa = fakeSupabase();
    TestBed.configureTestingModule({
      providers: [{ provide: SUPABASE_CLIENT, useValue: supa }],
    });
    return TestBed.inject(AuthService);
  }

  it('começa não autenticado quando não há sessão', () => {
    const svc = make();
    expect(svc.isAuthenticated()).toBe(false);
    expect(svc.accessToken()).toBeNull();
  });

  it('signUp envia nome em options.data', async () => {
    const svc = make();
    await svc.signUp('Ana', 'ana@ex.com', 'segredo123');
    expect(supa.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@ex.com',
        password: 'segredo123',
        options: expect.objectContaining({ data: { nome: 'Ana' } }),
      }),
    );
  });

  it('signIn chama signInWithPassword', async () => {
    const svc = make();
    await svc.signIn('ana@ex.com', 'segredo123');
    expect(supa.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'ana@ex.com', password: 'segredo123' });
  });

  it('updatePassword chama updateUser', async () => {
    const svc = make();
    await svc.updatePassword('novaSenha123');
    expect(supa.auth.updateUser).toHaveBeenCalledWith({ password: 'novaSenha123' });
  });

  it('reflete a sessão emitida pelo onAuthStateChange', () => {
    const svc = make();
    const cb = supa.auth.onAuthStateChange.mock.calls[0][0] as (e: string, s: unknown) => void;
    cb('SIGNED_IN', { access_token: 'jwt-123' });
    expect(svc.isAuthenticated()).toBe(true);
    expect(svc.accessToken()).toBe('jwt-123');
  });
});
