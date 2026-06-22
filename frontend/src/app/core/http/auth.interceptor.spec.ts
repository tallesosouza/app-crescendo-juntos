import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../auth/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const navigate = vi.fn();

  function setup(token: string | null) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { accessToken: () => token } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  it('adiciona Authorization Bearer quando há token', () => {
    setup('jwt-abc');
    http.get('/me').subscribe();
    const req = httpMock.expectOne('/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-abc');
    req.flush({});
  });

  it('não adiciona header quando não há token', () => {
    setup(null);
    http.get('/municipios').subscribe();
    const req = httpMock.expectOne('/municipios');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('em 401 navega para /login', () => {
    navigate.mockClear();
    setup('jwt-abc');
    http.get('/me').subscribe({ error: () => {} });
    httpMock.expectOne('/me').flush('nao autorizado', { status: 401, statusText: 'Unauthorized' });
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  afterEach(() => httpMock.verify());
});
