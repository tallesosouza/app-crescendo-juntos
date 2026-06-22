export interface Usuario {
  id: number;
  auth_uid: string;
  nome: string;
  email: string;
  data_nascimento: Date | null;
  municipio_id: number | null;
  consentimento_em: Date | null;
  versao_termos: string | null;
}
