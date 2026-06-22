import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaTransaction } from '../prisma/prisma-transaction';
import { TRANSACTION } from '../../application/ports/transaction.port';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository';
import { GESTACAO_REPOSITORY } from '../../domain/repositories/gestacao.repository';
import { BEBE_REPOSITORY } from '../../domain/repositories/bebe.repository';
import { CONVITE_REPOSITORY } from '../../domain/repositories/convite.repository';
import { PARTICIPACAO_REPOSITORY } from '../../domain/repositories/participacao.repository';
import { MUNICIPIO_REPOSITORY } from '../../domain/repositories/municipio.repository';
import { UsuarioPrismaRepository } from './usuario.prisma-repository';
import { GestacaoPrismaRepository } from './gestacao.prisma-repository';
import { BebePrismaRepository } from './bebe.prisma-repository';
import { ConvitePrismaRepository } from './convite.prisma-repository';
import { ParticipacaoPrismaRepository } from './participacao.prisma-repository';
import { MunicipioPrismaRepository } from './municipio.prisma-repository';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaTransaction,
    { provide: TRANSACTION, useExisting: PrismaTransaction },
    { provide: USUARIO_REPOSITORY, useClass: UsuarioPrismaRepository },
    { provide: GESTACAO_REPOSITORY, useClass: GestacaoPrismaRepository },
    { provide: BEBE_REPOSITORY, useClass: BebePrismaRepository },
    { provide: CONVITE_REPOSITORY, useClass: ConvitePrismaRepository },
    { provide: PARTICIPACAO_REPOSITORY, useClass: ParticipacaoPrismaRepository },
    { provide: MUNICIPIO_REPOSITORY, useClass: MunicipioPrismaRepository },
  ],
  exports: [
    PrismaTransaction,
    TRANSACTION,
    USUARIO_REPOSITORY,
    GESTACAO_REPOSITORY,
    BEBE_REPOSITORY,
    CONVITE_REPOSITORY,
    PARTICIPACAO_REPOSITORY,
    MUNICIPIO_REPOSITORY,
  ],
})
export class PersistenceModule {}
