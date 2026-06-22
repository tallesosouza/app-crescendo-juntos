export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export type PapelConvite = 'parceiro' | 'familia';
export type SexoBebe = 'masculino' | 'feminino' | 'indeterminado';

export interface MeResponse {
  id: number;
  nome: string;
  email: string;
  data_nascimento: string | null; // ISO yyyy-mm-dd
  municipio_id: number | null;
  consentimento_em: string | null; // ISO datetime
  tem_onboarding: boolean; // tem gestação própria OU participação
  gestacoes: { id: number; dpp: string; status: string; semana_atual: number }[];
  participacoes: { gestacao_id: number; papel: PapelConvite }[];
}

export interface MunicipioResponse {
  id: number;
  nome: string;
  uf: string;
}

export interface OnboardingGestanteRequest {
  perfil: {
    nome: string;
    data_nascimento: string; // ISO yyyy-mm-dd
    municipio_id: number;
    aceite_termos: boolean;
    versao_termos: string;
  };
  gestacao: { dpp?: string; semanas?: number }; // exatamente um
  bebe?: { nome?: string; sexo?: SexoBebe; data_nascimento?: string };
  convites?: { papel: PapelConvite }[];
}

export interface ConviteResponse {
  token: string;
  papel: PapelConvite;
  expira_em: string; // ISO datetime
  url_relativa: string; // `/convite/${token}`
}

export interface OnboardingGestanteResponse {
  gestacao_id: number;
  convites: ConviteResponse[];
}

export interface GerarConviteRequest {
  papel: PapelConvite;
}

export interface ConsultarConviteResponse {
  papel: PapelConvite;
  nome_gestante: string;
}

export interface AceitarConviteResponse {
  gestacao_id: number;
  papel: PapelConvite;
}

export interface EsqueciSenhaRequest {
  email: string;
}
