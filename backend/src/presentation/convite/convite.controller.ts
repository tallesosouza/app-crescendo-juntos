import { Body, Controller, Get, HttpCode, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AceitarConviteResponse, ConsultarConviteResponse, ConviteResponse } from '@crescendo/shared';
import { SupabaseJwtGuard } from '../common/supabase-jwt.guard';
import { AuthUser } from '../common/auth-user.decorator';
import type { AuthUser as AuthUserType } from '../../application/ports/token-verifier.port';
import { GerarConvite } from '../../application/use-cases/gerar-convite';
import { ConsultarConvite } from '../../application/use-cases/consultar-convite';
import { AceitarConvite } from '../../application/use-cases/aceitar-convite';
import { GerarConviteDto } from './dto/convite.dto';
import { GERAR_CONVITE, CONSULTAR_CONVITE, ACEITAR_CONVITE } from './convite.module';

@ApiTags('convites')
@Controller('convites')
export class ConviteController {
  constructor(
    @Inject(GERAR_CONVITE) private readonly gerar: GerarConvite,
    @Inject(CONSULTAR_CONVITE) private readonly consultar: ConsultarConvite,
    @Inject(ACEITAR_CONVITE) private readonly aceitar: AceitarConvite,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Gera um convite (link genérico por papel) para a gestação do usuário' })
  criar(@AuthUser() user: AuthUserType, @Body() dto: GerarConviteDto): Promise<ConviteResponse> {
    return this.gerar.execute(user.auth_uid, dto.papel);
  }

  @Get(':token')
  @ApiOperation({ summary: 'Consulta um convite por token (público)' })
  ver(@Param('token') token: string): Promise<ConsultarConviteResponse> {
    return this.consultar.execute(token);
  }

  @Post(':token/aceitar')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(SupabaseJwtGuard)
  @ApiOperation({ summary: 'Aceita um convite (qualquer conta autenticada; cria participação)' })
  aceitarConvite(@AuthUser() user: AuthUserType, @Param('token') token: string): Promise<AceitarConviteResponse> {
    return this.aceitar.execute(user.auth_uid, token);
  }
}
