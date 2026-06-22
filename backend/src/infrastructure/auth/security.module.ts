import { Module } from '@nestjs/common';
import { createRemoteJWKSet } from 'jose';
import { TOKEN_VERIFIER } from '../../application/ports/token-verifier.port';
import { JoseSupabaseTokenVerifier } from './jose-supabase-token-verifier';
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
    SupabaseJwtGuard,
  ],
  exports: [TOKEN_VERIFIER, SupabaseJwtGuard],
})
export class SecurityModule {}
