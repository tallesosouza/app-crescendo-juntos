import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  MeResponse,
  MunicipioResponse,
  OnboardingGestanteRequest,
  OnboardingGestanteResponse,
  GerarConviteRequest,
  ConviteResponse,
  ConsultarConviteResponse,
  AceitarConviteResponse,
  EsqueciSenhaRequest,
} from '@crescendo/shared';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.base}/me`);
  }

  listarMunicipios(): Observable<MunicipioResponse[]> {
    return this.http.get<MunicipioResponse[]>(`${this.base}/municipios`);
  }

  onboardingGestante(body: OnboardingGestanteRequest): Observable<OnboardingGestanteResponse> {
    return this.http.post<OnboardingGestanteResponse>(`${this.base}/onboarding/gestante`, body);
  }

  gerarConvite(body: GerarConviteRequest): Observable<ConviteResponse> {
    return this.http.post<ConviteResponse>(`${this.base}/convites`, body);
  }

  consultarConvite(token: string): Observable<ConsultarConviteResponse> {
    return this.http.get<ConsultarConviteResponse>(`${this.base}/convites/${token}`);
  }

  aceitarConvite(token: string): Observable<AceitarConviteResponse> {
    return this.http.post<AceitarConviteResponse>(`${this.base}/convites/${token}/aceitar`, {});
  }

  esqueciSenha(body: EsqueciSenhaRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/esqueci-senha`, body);
  }
}
