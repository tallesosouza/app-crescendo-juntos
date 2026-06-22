import { Module } from '@nestjs/common';
import { HealthController } from './presentation/health/health.controller';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { MeModule } from './presentation/me/me.module';

@Module({
  imports: [PrismaModule, MeModule],
  controllers: [HealthController],
})
export class AppModule {}
