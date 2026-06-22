import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../infrastructure/persistence/persistence.module';
import { SecurityModule } from '../../infrastructure/auth/security.module';
import { TRANSACTION } from '../../application/ports/transaction.port';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository';
import { GESTACAO_REPOSITORY } from '../../domain/repositories/gestacao.repository';
import { BEBE_REPOSITORY } from '../../domain/repositories/bebe.repository';
import { CONVITE_REPOSITORY } from '../../domain/repositories/convite.repository';
import { RealizarOnboardingGestante } from '../../application/use-cases/realizar-onboarding-gestante';
import { OnboardingController } from './onboarding.controller';

export const REALIZAR_ONBOARDING = Symbol('RealizarOnboardingGestante');

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [OnboardingController],
  providers: [
    {
      provide: REALIZAR_ONBOARDING,
      useFactory: (txn, usuarios, gestacoes, bebes, convites) =>
        new RealizarOnboardingGestante(txn, usuarios, gestacoes, bebes, convites),
      inject: [TRANSACTION, USUARIO_REPOSITORY, GESTACAO_REPOSITORY, BEBE_REPOSITORY, CONVITE_REPOSITORY],
    },
  ],
})
export class OnboardingModule {}
