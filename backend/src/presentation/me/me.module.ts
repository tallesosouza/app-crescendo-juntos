import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../infrastructure/persistence/persistence.module';
import { SecurityModule } from '../../infrastructure/auth/security.module';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository';
import { GESTACAO_REPOSITORY } from '../../domain/repositories/gestacao.repository';
import { PARTICIPACAO_REPOSITORY } from '../../domain/repositories/participacao.repository';
import { ObterContextoUsuario } from '../../application/use-cases/obter-contexto-usuario';
import { MeController } from './me.controller';
import { OBTER_CONTEXTO_USUARIO } from '../common/use-case.tokens';

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [MeController],
  providers: [
    {
      provide: OBTER_CONTEXTO_USUARIO,
      useFactory: (usuarios, gestacoes, participacoes) =>
        new ObterContextoUsuario(usuarios, gestacoes, participacoes),
      inject: [USUARIO_REPOSITORY, GESTACAO_REPOSITORY, PARTICIPACAO_REPOSITORY],
    },
  ],
})
export class MeModule {}
