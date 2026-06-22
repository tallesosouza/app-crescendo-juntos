import { jwtVerify, JWTVerifyGetKey } from 'jose';
import { AppError } from '../../domain/errors/app-error';
import { AuthUser, TokenVerifier } from '../../application/ports/token-verifier.port';

export class JoseSupabaseTokenVerifier implements TokenVerifier {
  constructor(private readonly jwks: JWTVerifyGetKey) {}

  async verify(token: string): Promise<AuthUser> {
    try {
      const { payload } = await jwtVerify(token, this.jwks);
      const meta = (payload.user_metadata ?? {}) as { nome?: string };
      return {
        auth_uid: String(payload.sub),
        email: String(payload.email ?? ''),
        nome: meta.nome ?? null,
      };
    } catch {
      throw new AppError('Token inválido', 401);
    }
  }
}
