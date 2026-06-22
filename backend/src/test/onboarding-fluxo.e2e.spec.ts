import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose';
import { randomUUID } from 'crypto';
import { AppModule } from '../app.module';
import { AppExceptionFilter } from '../presentation/common/app-exception.filter';
import { TOKEN_VERIFIER } from '../application/ports/token-verifier.port';
import { JoseSupabaseTokenVerifier } from '../infrastructure/auth/jose-supabase-token-verifier';

describe('Fluxo F1 (e2e)', () => {
  let app: INestApplication;
  let sign: (claims: Record<string, unknown>) => Promise<string>;

  beforeAll(async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const pub = await exportJWK(publicKey);
    pub.kid = 'test'; pub.alg = 'RS256';
    const jwks = createLocalJWKSet({ keys: [pub] });
    sign = (claims) =>
      new SignJWT(claims).setProtectedHeader({ alg: 'RS256', kid: 'test' }).setIssuedAt().setExpirationTime('1h').sign(privateKey);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue(new JoseSupabaseTokenVerifier(jwks as never))
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AppExceptionFilter());
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('gestante: /me cria usuário → onboarding → gera convite; convidado aceita', async () => {
    const uidGestante = randomUUID();
    const tokenGestante = await sign({ sub: uidGestante, email: `${uidGestante}@ex.com`, user_metadata: { nome: 'Ana' } });
    const http = request(app.getHttpServer());

    // 1. /me cria a linha
    const me1 = await http.get('/me').set('Authorization', `Bearer ${tokenGestante}`).expect(200);
    expect(me1.body.nome).toBe('Ana');
    expect(me1.body.tem_onboarding).toBe(false);

    // 2. municípios (pega um id real do seed)
    const muns = await http.get('/municipios').set('Authorization', `Bearer ${tokenGestante}`).expect(200);
    const municipio_id = muns.body[0].id;

    // 3. onboarding com 1 convite
    const onb = await http
      .post('/onboarding/gestante')
      .set('Authorization', `Bearer ${tokenGestante}`)
      .send({
        perfil: { nome: 'Ana', data_nascimento: '1995-05-05', municipio_id, aceite_termos: true, versao_termos: 'v1' },
        gestacao: { semanas: 10 },
        convites: [{ papel: 'parceiro' }],
      })
      .expect(201);
    const token = onb.body.convites[0].token;
    expect(token).toBeTruthy();

    // 4. /me da gestante agora tem onboarding
    const me2 = await http.get('/me').set('Authorization', `Bearer ${tokenGestante}`).expect(200);
    expect(me2.body.tem_onboarding).toBe(true);
    expect(me2.body.gestacoes[0].semana_atual).toBe(10);

    // 5. consulta pública do convite
    const consulta = await http.get(`/convites/${token}`).expect(200);
    expect(consulta.body).toEqual({ papel: 'parceiro', nome_gestante: 'Ana' });

    // 6. convidado (outro usuário) faz /me e aceita
    const uidConvidado = randomUUID();
    const tokenConvidado = await sign({ sub: uidConvidado, email: `${uidConvidado}@ex.com`, user_metadata: { nome: 'Beto' } });
    await http.get('/me').set('Authorization', `Bearer ${tokenConvidado}`).expect(200);
    const aceite = await http.post(`/convites/${token}/aceitar`).set('Authorization', `Bearer ${tokenConvidado}`).expect(200);
    expect(aceite.body.papel).toBe('parceiro');

    // 7. segundo aceite do mesmo token → 410 (uso único)
    await http.post(`/convites/${token}/aceitar`).set('Authorization', `Bearer ${tokenConvidado}`).expect(410);

    // 8. /me do convidado mostra a participação e tem_onboarding=true (não vai ao wizard)
    const meConvidado = await http.get('/me').set('Authorization', `Bearer ${tokenConvidado}`).expect(200);
    expect(meConvidado.body.tem_onboarding).toBe(true);
    expect(meConvidado.body.participacoes[0].papel).toBe('parceiro');
    expect(meConvidado.body.gestacoes).toHaveLength(0);
  });

  it('rejeita requisição sem Bearer (401)', async () => {
    await request(app.getHttpServer()).get('/me').expect(401);
  });
});
