import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsInt, IsISO8601, IsIn, IsObject, IsOptional, IsString, ValidateNested,
} from 'class-validator';
import type { OnboardingGestanteRequest, PapelConvite, SexoBebe } from '@crescendo/shared';

class PerfilDto {
  @ApiProperty() @IsString() nome!: string;
  @ApiProperty({ example: '1995-05-05' }) @IsISO8601() data_nascimento!: string;
  @ApiProperty() @IsInt() municipio_id!: number;
  @ApiProperty() @IsBoolean() aceite_termos!: boolean;
  @ApiProperty({ example: 'v1' }) @IsString() versao_termos!: string;
}
class GestacaoDto {
  @ApiPropertyOptional({ example: '2026-12-01' }) @IsOptional() @IsISO8601() dpp?: string;
  @ApiPropertyOptional({ example: 12 }) @IsOptional() @IsInt() semanas?: number;
}
class BebeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nome?: string;
  @ApiPropertyOptional({ enum: ['masculino', 'feminino', 'indeterminado'] })
  @IsOptional() @IsIn(['masculino', 'feminino', 'indeterminado']) sexo?: SexoBebe;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() data_nascimento?: string;
}
class ConviteItemDto {
  @ApiProperty({ enum: ['parceiro', 'familia'] }) @IsIn(['parceiro', 'familia']) papel!: PapelConvite;
}

export class OnboardingGestanteDto implements OnboardingGestanteRequest {
  @ApiProperty({ type: PerfilDto }) @IsObject() @ValidateNested() @Type(() => PerfilDto) perfil!: PerfilDto;
  @ApiProperty({ type: GestacaoDto }) @IsObject() @ValidateNested() @Type(() => GestacaoDto) gestacao!: GestacaoDto;
  @ApiPropertyOptional({ type: BebeDto }) @IsOptional() @ValidateNested() @Type(() => BebeDto) bebe?: BebeDto;
  @ApiPropertyOptional({ type: [ConviteItemDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ConviteItemDto) convites?: ConviteItemDto[];
}
