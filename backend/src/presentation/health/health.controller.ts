import { Controller, Get } from '@nestjs/common';
import { HealthResponse } from '@crescendo/shared';

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
