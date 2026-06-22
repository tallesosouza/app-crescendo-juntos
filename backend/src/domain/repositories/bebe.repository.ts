import { Bebe, SexoBebe } from '../entities/bebe';

export interface CriarBebe {
  gestacao_id: number;
  nome?: string;
  sexo?: SexoBebe;
  data_nascimento?: Date;
}

export interface BebeRepository {
  create(data: CriarBebe): Promise<Bebe>;
}

export const BEBE_REPOSITORY = Symbol('BebeRepository');
