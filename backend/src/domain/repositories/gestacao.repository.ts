import { Gestacao } from '../entities/gestacao';

export interface GestacaoRepository {
  create(data: { gestante_id: number; dpp: Date; status: 'gestacao' }): Promise<Gestacao>;
  findByGestante(gestanteId: number): Promise<Gestacao[]>;
}

export const GESTACAO_REPOSITORY = Symbol('GestacaoRepository');
