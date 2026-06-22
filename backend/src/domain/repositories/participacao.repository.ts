import { Participacao } from '../entities/participacao';
import { PapelConvite } from '../entities/convite';

export interface CriarParticipacao {
  gestacao_id: number;
  usuario_id: number;
  papel: PapelConvite;
  data_entrada: Date;
}

export interface ParticipacaoRepository {
  exists(gestacaoId: number, usuarioId: number): Promise<boolean>;
  create(data: CriarParticipacao): Promise<void>;
  findByUsuario(usuarioId: number): Promise<Participacao[]>;
}

export const PARTICIPACAO_REPOSITORY = Symbol('ParticipacaoRepository');
