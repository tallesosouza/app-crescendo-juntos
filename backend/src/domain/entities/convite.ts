export type PapelConvite = 'parceiro' | 'familia';

export interface Convite {
  id: number;
  gestacao_id: number;
  papel: PapelConvite;
  token: string;
  status: string;
  expira_em: Date;
  criado_por: number;
  aceito_em: Date | null;
}

export interface ConviteComGestante {
  id: number;
  gestacao_id: number;
  papel: PapelConvite;
  status: string;
  expira_em: Date;
  nome_gestante: string;
}
