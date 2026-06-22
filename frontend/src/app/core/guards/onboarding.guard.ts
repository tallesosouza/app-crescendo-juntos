import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ApiService } from '../api/api.service';

export const onboardingGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  return api.getMe().pipe(
    map((me) => (me.tem_onboarding ? router.parseUrl('/') : true)),
    catchError(() => of(true)),
  );
};
