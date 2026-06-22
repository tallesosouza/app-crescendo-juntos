import { computed, inject, Injectable, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './supabase-client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly _session = signal<Session | null>(null);

  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);

  constructor() {
    void this.supabase.auth.getSession().then(({ data }) => this._session.set(data.session));
    this.supabase.auth.onAuthStateChange((_event, session) => this._session.set(session));
  }

  accessToken(): string | null {
    return this._session()?.access_token ?? null;
  }

  signUp(nome: string, email: string, password: string) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: { data: { nome }, emailRedirectTo: `${location.origin}/login` },
    });
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  updatePassword(password: string) {
    return this.supabase.auth.updateUser({ password });
  }
}
