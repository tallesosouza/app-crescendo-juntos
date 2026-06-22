import { Injectable } from '@nestjs/common';
import { PrismaTransaction } from '../prisma/prisma-transaction';
import { Usuario } from '../../domain/entities/usuario';
import { AtualizarPerfil, CriarUsuario, UsuarioRepository } from '../../domain/repositories/usuario.repository';

@Injectable()
export class UsuarioPrismaRepository implements UsuarioRepository {
  constructor(private readonly txn: PrismaTransaction) {}

  async findByAuthUid(authUid: string): Promise<Usuario | null> {
    return this.txn.db().usuario.findUnique({ where: { auth_uid: authUid } }) as Promise<Usuario | null>;
  }

  async create(data: CriarUsuario): Promise<Usuario> {
    return this.txn.db().usuario.create({ data }) as Promise<Usuario>;
  }

  async updatePerfil(id: number, data: AtualizarPerfil): Promise<Usuario> {
    return this.txn.db().usuario.update({ where: { id }, data }) as Promise<Usuario>;
  }
}
