import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthResponse } from '@crescendo/shared';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness check' })
  check(): HealthResponse {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
