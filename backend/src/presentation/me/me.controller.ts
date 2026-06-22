import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { MeResponse } from '@crescendo/shared';
import { SupabaseJwtGuard } from '../common/supabase-jwt.guard';
import { AuthUser } from '../common/auth-user.decorator';
import type { AuthUser as AuthUserType } from '../../application/ports/token-verifier.port';
import { ObterContextoUsuario } from '../../application/use-cases/obter-contexto-usuario';
import { OBTER_CONTEXTO_USUARIO } from './me.module';

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
@UseGuards(SupabaseJwtGuard)
export class MeController {
  constructor(@Inject(OBTER_CONTEXTO_USUARIO) private readonly uc: ObterContextoUsuario) {}

  @Get()
  @ApiOperation({ summary: 'Contexto do usuário (cria a linha no 1º acesso)' })
  me(@AuthUser() user: AuthUserType): Promise<MeResponse> {
    return this.uc.execute(user);
  }
}
