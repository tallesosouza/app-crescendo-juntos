import { Module } from '@nestjs/common';
import { HealthController } from './presentation/health/health.controller';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { MeModule } from './presentation/me/me.module';
import { MunicipioModule } from './presentation/municipio/municipio.module';
import { OnboardingModule } from './presentation/onboarding/onboarding.module';
import { ConviteModule } from './presentation/convite/convite.module';
import { AuthModule } from './presentation/auth/auth.module';

@Module({
  imports: [PrismaModule, MeModule, MunicipioModule, OnboardingModule, ConviteModule, AuthModule],
  controllers: [HealthController],
})
export class AppModule {}
