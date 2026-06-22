import { Module } from '@nestjs/common';
import { HealthController } from './presentation/health/health.controller';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class AppModule {}
