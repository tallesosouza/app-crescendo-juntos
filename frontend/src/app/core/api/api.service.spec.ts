import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';

const BASE = 'http://localhost:3000';

describe('ApiService', () => {
  let api: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getMe faz GET /me', () => {
    api.getMe().subscribe();
    const req = httpMock.expectOne(`${BASE}/me`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('listarMunicipios faz GET /municipios', () => {
    api.listarMunicipios().subscribe();
    const req = httpMock.expectOne(`${BASE}/municipios`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('onboardingGestante faz POST /onboarding/gestante com o corpo', () => {
    const body = { perfil: { nome: 'Ana', data_nascimento: '1995-05-05', municipio_id: 1, aceite_termos: true, versao_termos: 'v1' }, gestacao: { semanas: 10 } };
    api.onboardingGestante(body as never).subscribe();
    const req = httpMock.expectOne(`${BASE}/onboarding/gestante`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ gestacao_id: 1, convites: [] });
  });

  it('gerarConvite faz POST /convites', () => {
    api.gerarConvite({ papel: 'parceiro' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/convites`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ papel: 'parceiro' });
    req.flush({ token: 't', papel: 'parceiro', expira_em: '', url_relativa: '/convite/t' });
  });

  it('consultarConvite faz GET /convites/:token', () => {
    api.consultarConvite('tok123').subscribe();
    const req = httpMock.expectOne(`${BASE}/convites/tok123`);
    expect(req.request.method).toBe('GET');
    req.flush({ papel: 'parceiro', nome_gestante: 'Ana' });
  });

  it('aceitarConvite faz POST /convites/:token/aceitar', () => {
    api.aceitarConvite('tok123').subscribe();
    const req = httpMock.expectOne(`${BASE}/convites/tok123/aceitar`);
    expect(req.request.method).toBe('POST');
    req.flush({ gestacao_id: 9, papel: 'parceiro' });
  });

  it('esqueciSenha faz POST /auth/esqueci-senha', () => {
    api.esqueciSenha({ email: 'ana@ex.com' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/auth/esqueci-senha`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ana@ex.com' });
    req.flush(null);
  });
});
