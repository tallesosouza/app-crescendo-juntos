import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../infrastructure/persistence/persistence.module';
import { SecurityModule } from '../../infrastructure/auth/security.module';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository';
import { GESTACAO_REPOSITORY } from '../../domain/repositories/gestacao.repository';
import { CONVITE_REPOSITORY } from '../../domain/repositories/convite.repository';
import { GerarConvite } from '../../application/use-cases/gerar-convite';
import { ConviteController } from './convite.controller';

export const GERAR_CONVITE = Symbol('GerarConvite');

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [ConviteController],
  providers: [
    {
      provide: GERAR_CONVITE,
      useFactory: (usuarios, gestacoes, convites) => new GerarConvite(usuarios, gestacoes, convites),
      inject: [USUARIO_REPOSITORY, GESTACAO_REPOSITORY, CONVITE_REPOSITORY],
    },
  ],
})
export class ConviteModule {}
