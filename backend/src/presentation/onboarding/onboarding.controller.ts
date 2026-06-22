import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { OnboardingGestanteResponse } from '@crescendo/shared';
import { SupabaseJwtGuard } from '../common/supabase-jwt.guard';
import { AuthUser } from '../common/auth-user.decorator';
import type { AuthUser as AuthUserType } from '../../application/ports/token-verifier.port';
import { RealizarOnboardingGestante } from '../../application/use-cases/realizar-onboarding-gestante';
import { OnboardingGestanteDto } from './dto/onboarding.dto';
import { REALIZAR_ONBOARDING } from '../common/use-case.tokens';

@ApiTags('onboarding')
@ApiBearerAuth()
@Controller('onboarding')
@UseGuards(SupabaseJwtGuard)
export class OnboardingController {
  constructor(@Inject(REALIZAR_ONBOARDING) private readonly uc: RealizarOnboardingGestante) {}

  @Post('gestante')
  @ApiOperation({ summary: 'Onboarding da gestante (perfil + gestação + bebê/convites opcionais)' })
  gestante(@AuthUser() user: AuthUserType, @Body() dto: OnboardingGestanteDto): Promise<OnboardingGestanteResponse> {
    return this.uc.execute(user.auth_uid, dto);
  }
}
