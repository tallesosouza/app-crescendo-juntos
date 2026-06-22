import { Convite, ConviteComGestante, PapelConvite } from '../entities/convite';

export interface CriarConvite {
  gestacao_id: number;
  papel: PapelConvite;
  token: string;
  expira_em: Date;
  criado_por: number;
}

export interface ConviteRepository {
  create(data: CriarConvite): Promise<Convite>;
  findByToken(token: string): Promise<ConviteComGestante | null>;
  markAceito(id: number, aceito_em: Date): Promise<void>;
}

export const CONVITE_REPOSITORY = Symbol('ConviteRepository');
