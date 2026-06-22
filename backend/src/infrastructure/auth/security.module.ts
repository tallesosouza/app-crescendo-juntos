import { Module } from '@nestjs/common';
import { createRemoteJWKSet } from 'jose';
import { TOKEN_VERIFIER } from '../../application/ports/token-verifier.port';
import { PASSWORD_RESET_GATEWAY } from '../../application/ports/password-reset-gateway.port';
import { JoseSupabaseTokenVerifier } from './jose-supabase-token-verifier';
import { SupabaseAuthGateway } from './supabase-auth-gateway';
import { SupabaseJwtGuard } from '../../presentation/common/supabase-jwt.guard';

@Module({
  providers: [
    {
      provide: TOKEN_VERIFIER,
      useFactory: () => {
        const jwks = createRemoteJWKSet(new URL(process.env.SUPABASE_JWKS_URL as string));
        return new JoseSupabaseTokenVerifier(jwks);
      },
    },
    { provide: PASSWORD_RESET_GATEWAY, useClass: SupabaseAuthGateway },
    SupabaseJwtGuard,
  ],
  exports: [TOKEN_VERIFIER, PASSWORD_RESET_GATEWAY, SupabaseJwtGuard],
})
export class SecurityModule {}
