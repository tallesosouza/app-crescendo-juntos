import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose';
import { JoseSupabaseTokenVerifier } from './jose-supabase-token-verifier';

describe('JoseSupabaseTokenVerifier', () => {
  let verifier: JoseSupabaseTokenVerifier;
  let sign: (claims: Record<string, unknown>) => Promise<string>;

  beforeAll(async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const pubJwk = await exportJWK(publicKey);
    pubJwk.kid = 'test-key';
    pubJwk.alg = 'RS256';
    const jwks = createLocalJWKSet({ keys: [pubJwk] });
    verifier = new JoseSupabaseTokenVerifier(jwks as never);
    sign = (claims) =>
      new SignJWT(claims)
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey);
  });

  it('extrai auth_uid, email e nome do user_metadata', async () => {
    const token = await sign({ sub: 'uuid-123', email: 'ana@ex.com', user_metadata: { nome: 'Ana' } });
    const user = await verifier.verify(token);
    expect(user).toEqual({ auth_uid: 'uuid-123', email: 'ana@ex.com', nome: 'Ana' });
  });

  it('nome nulo quando não há user_metadata.nome', async () => {
    const token = await sign({ sub: 'uuid-456', email: 'bia@ex.com' });
    const user = await verifier.verify(token);
    expect(user.nome).toBeNull();
  });

  it('rejeita token adulterado', async () => {
    const token = (await sign({ sub: 'x', email: 'x@ex.com' })) + 'tampered';
    await expect(verifier.verify(token)).rejects.toMatchObject({ status: 401 });
  });
});
