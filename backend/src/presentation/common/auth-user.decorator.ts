import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser as AuthUserType } from '../../application/ports/token-verifier.port';

export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserType => ctx.switchToHttp().getRequest().user,
);
