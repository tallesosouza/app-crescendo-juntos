import { Injectable } from '@angular/core';

const KEY = 'cj_pending_invite';

@Injectable({ providedIn: 'root' })
export class PendingInviteService {
  set(token: string): void {
    localStorage.setItem(KEY, token);
  }

  get(): string | null {
    return localStorage.getItem(KEY);
  }

  clear(): void {
    localStorage.removeItem(KEY);
  }
}
