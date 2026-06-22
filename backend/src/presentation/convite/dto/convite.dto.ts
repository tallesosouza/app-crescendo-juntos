import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { GerarConviteRequest, PapelConvite } from '@crescendo/shared';

export class GerarConviteDto implements GerarConviteRequest {
  @ApiProperty({ enum: ['parceiro', 'familia'] })
  @IsIn(['parceiro', 'familia'])
  papel!: PapelConvite;
}
