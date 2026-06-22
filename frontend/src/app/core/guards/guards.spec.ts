import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { onboardingGuard } from './onboarding.guard';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';

function urlTreeFor(path: string): UrlTree {
  return TestBed.inject(Router).parseUrl(path);
}

describe('guards', () => {
  function setup(opts: { authed?: boolean; me?: unknown; meError?: boolean } = {}) {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => opts.authed ?? false } },
        {
          provide: ApiService,
          useValue: {
            getMe: () => (opts.meError ? throwError(() => new Error('x')) : of(opts.me ?? { tem_onboarding: false })),
          },
        },
      ],
    });
  }

  const run = <T>(g: () => T): T => TestBed.runInInjectionContext(g as never);
  const route = {} as never;
  const state = { url: '/x' } as never;

  it('authGuard: libera autenticado', () => {
    setup({ authed: true });
    expect(run(() => authGuard(route, state))).toBe(true);
  });

  it('authGuard: redireciona não autenticado para /login', () => {
    setup({ authed: false });
    const res = run(() => authGuard(route, state)) as UrlTree;
    expect(res.toString()).toBe(urlTreeFor('/login').toString());
  });

  it('guestGuard: libera não autenticado', () => {
    setup({ authed: false });
    expect(run(() => guestGuard(route, state))).toBe(true);
  });

  it('guestGuard: redireciona autenticado para /', () => {
    setup({ authed: true });
    const res = run(() => guestGuard(route, state)) as UrlTree;
    expect(res.toString()).toBe(urlTreeFor('/').toString());
  });

  it('onboardingGuard: tem_onboarding=true → redireciona para /', async () => {
    setup({ authed: true, me: { tem_onboarding: true } });
    const r = await firstValueFrom(
      run(() => onboardingGuard(route, state)) as import('rxjs').Observable<boolean | UrlTree>,
    );
    expect((r as UrlTree).toString()).toBe(urlTreeFor('/').toString());
  });

  it('onboardingGuard: tem_onboarding=false → libera', async () => {
    setup({ authed: true, me: { tem_onboarding: false } });
    const r = await firstValueFrom(
      run(() => onboardingGuard(route, state)) as import('rxjs').Observable<boolean | UrlTree>,
    );
    expect(r).toBe(true);
  });
});
