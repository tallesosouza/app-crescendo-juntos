import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { MunicipioResponse } from '@crescendo/shared';
import { SupabaseJwtGuard } from '../common/supabase-jwt.guard';
import { ListarMunicipios } from '../../application/use-cases/listar-municipios';
import { LISTAR_MUNICIPIOS } from './municipio.module';

@ApiTags('municipios')
@ApiBearerAuth()
@Controller('municipios')
@UseGuards(SupabaseJwtGuard)
export class MunicipioController {
  constructor(@Inject(LISTAR_MUNICIPIOS) private readonly uc: ListarMunicipios) {}

  @Get()
  @ApiOperation({ summary: 'Lista os municípios do catálogo' })
  listar(): Promise<MunicipioResponse[]> {
    return this.uc.execute();
  }
}
