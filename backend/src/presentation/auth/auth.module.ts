import { Module } from '@nestjs/common';
import { SecurityModule } from '../../infrastructure/auth/security.module';
import { PASSWORD_RESET_GATEWAY } from '../../application/ports/password-reset-gateway.port';
import { SolicitarRedefinicaoSenha } from '../../application/use-cases/solicitar-redefinicao-senha';
import { AuthController } from './auth.controller';
import { SOLICITAR_REDEFINICAO } from '../common/use-case.tokens';

@Module({
  imports: [SecurityModule],
  controllers: [AuthController],
  providers: [
    {
      provide: SOLICITAR_REDEFINICAO,
      useFactory: (gateway) => new SolicitarRedefinicaoSenha(gateway),
      inject: [PASSWORD_RESET_GATEWAY],
    },
  ],
})
export class AuthModule {}
