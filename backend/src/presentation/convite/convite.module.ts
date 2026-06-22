import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../infrastructure/persistence/persistence.module';
import { SecurityModule } from '../../infrastructure/auth/security.module';
import { TRANSACTION } from '../../application/ports/transaction.port';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository';
import { GESTACAO_REPOSITORY } from '../../domain/repositories/gestacao.repository';
import { CONVITE_REPOSITORY } from '../../domain/repositories/convite.repository';
import { PARTICIPACAO_REPOSITORY } from '../../domain/repositories/participacao.repository';
import { GerarConvite } from '../../application/use-cases/gerar-convite';
import { ConsultarConvite } from '../../application/use-cases/consultar-convite';
import { AceitarConvite } from '../../application/use-cases/aceitar-convite';
import { ConviteController } from './convite.controller';
import { GERAR_CONVITE, CONSULTAR_CONVITE, ACEITAR_CONVITE } from '../common/use-case.tokens';

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [ConviteController],
  providers: [
    {
      provide: GERAR_CONVITE,
      useFactory: (usuarios, gestacoes, convites) => new GerarConvite(usuarios, gestacoes, convites),
      inject: [USUARIO_REPOSITORY, GESTACAO_REPOSITORY, CONVITE_REPOSITORY],
    },
    {
      provide: CONSULTAR_CONVITE,
      useFactory: (convites) => new ConsultarConvite(convites),
      inject: [CONVITE_REPOSITORY],
    },
    {
      provide: ACEITAR_CONVITE,
      useFactory: (txn, usuarios, convites, participacoes) => new AceitarConvite(txn, usuarios, convites, participacoes),
      inject: [TRANSACTION, USUARIO_REPOSITORY, CONVITE_REPOSITORY, PARTICIPACAO_REPOSITORY],
    },
  ],
})
export class ConviteModule {}
