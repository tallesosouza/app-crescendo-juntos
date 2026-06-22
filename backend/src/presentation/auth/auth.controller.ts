import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SolicitarRedefinicaoSenha } from '../../application/use-cases/solicitar-redefinicao-senha';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { SOLICITAR_REDEFINICAO } from '../common/use-case.tokens';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(SOLICITAR_REDEFINICAO) private readonly uc: SolicitarRedefinicaoSenha) {}

  @Post('esqueci-senha')
  @HttpCode(204)
  @ApiOperation({ summary: 'Dispara e-mail de redefinição de senha (via Supabase); resposta sempre 204' })
  async esqueciSenha(@Body() dto: EsqueciSenhaDto): Promise<void> {
    await this.uc.execute(dto.email);
  }
}
