import { MunicipioRepository } from '../../domain/repositories/municipio.repository';
import type { MunicipioResponse } from '@crescendo/shared';

export class ListarMunicipios {
  constructor(private readonly municipios: MunicipioRepository) {}
  execute(): Promise<MunicipioResponse[]> {
    return this.municipios.findAll();
  }
}
