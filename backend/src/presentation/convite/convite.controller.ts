import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ConviteResponse } from '@crescendo/shared';
import { SupabaseJwtGuard } from '../common/supabase-jwt.guard';
import { AuthUser } from '../common/auth-user.decorator';
import type { AuthUser as AuthUserType } from '../../application/ports/token-verifier.port';
import { GerarConvite } from '../../application/use-cases/gerar-convite';
import { GerarConviteDto } from './dto/convite.dto';
import { GERAR_CONVITE } from './convite.module';

@ApiTags('convites')
@Controller('convites')
export class ConviteController {
  constructor(@Inject(GERAR_CONVITE) private readonly gerar: GerarConvite) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Gera um convite (link genérico por papel) para a gestação do usuário' })
  criar(@AuthUser() user: AuthUserType, @Body() dto: GerarConviteDto): Promise<ConviteResponse> {
    return this.gerar.execute(user.auth_uid, dto.papel);
  }
}
