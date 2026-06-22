import { Usuario } from '../entities/usuario';

export interface CriarUsuario {
  auth_uid: string;
  nome: string;
  email: string;
}
export interface AtualizarPerfil {
  nome?: string;
  data_nascimento?: Date;
  municipio_id?: number;
  consentimento_em?: Date;
  versao_termos?: string;
}

export interface UsuarioRepository {
  findByAuthUid(authUid: string): Promise<Usuario | null>;
  create(data: CriarUsuario): Promise<Usuario>;
  updatePerfil(id: number, data: AtualizarPerfil): Promise<Usuario>;
}

export const USUARIO_REPOSITORY = Symbol('UsuarioRepository');
