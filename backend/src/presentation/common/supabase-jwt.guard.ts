import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TOKEN_VERIFIER, TokenVerifier } from '../../application/ports/token-verifier.port';

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  constructor(@Inject(TOKEN_VERIFIER) private readonly verifier: TokenVerifier) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string = req.headers['authorization'] ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization Bearer ausente');
    }
    try {
      req.user = await this.verifier.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
