import { Municipio } from '../entities/municipio';

export interface MunicipioRepository {
  findAll(): Promise<Municipio[]>;
}

export const MUNICIPIO_REPOSITORY = Symbol('MunicipioRepository');
