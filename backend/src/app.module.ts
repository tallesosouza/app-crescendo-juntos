import { Module } from '@nestjs/common';
import { HealthController } from './presentation/health/health.controller';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { MeModule } from './presentation/me/me.module';
import { MunicipioModule } from './presentation/municipio/municipio.module';

@Module({
  imports: [PrismaModule, MeModule, MunicipioModule],
  controllers: [HealthController],
})
export class AppModule {}
