import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import type { EsqueciSenhaRequest } from '@crescendo/shared';

export class EsqueciSenhaDto implements EsqueciSenhaRequest {
  @ApiProperty({ example: 'ana@ex.com' })
  @IsEmail()
  email!: string;
}
