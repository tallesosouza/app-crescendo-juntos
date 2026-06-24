import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import { PendingInviteService } from '../auth/pending-invite.service';

@Injectable({ providedIn: 'root' })
export class PendingInviteFlowService {
  private readonly api = inject(ApiService);
  private readonly pending = inject(PendingInviteService);

  /** Reidrata o token de convite (localStorage) e o consome; limpa em qualquer desfecho. */
  consumir(): Observable<boolean> {
    const token = this.pending.get();
    if (!token) return of(false);
    return this.api.aceitarConvite(token).pipe(
      tap(() => this.pending.clear()),
      map(() => true),
      catchError(() => {
        this.pending.clear();
        return of(false);
      }),
    );
  }
}
