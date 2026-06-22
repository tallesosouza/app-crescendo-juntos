import { Injectable } from '@nestjs/common';
import { PrismaTransaction } from '../prisma/prisma-transaction';
import { Participacao } from '../../domain/entities/participacao';
import { PapelConvite } from '../../domain/entities/convite';
import { CriarParticipacao, ParticipacaoRepository } from '../../domain/repositories/participacao.repository';

@Injectable()
export class ParticipacaoPrismaRepository implements ParticipacaoRepository {
  constructor(private readonly txn: PrismaTransaction) {}

  async exists(gestacaoId: number, usuarioId: number): Promise<boolean> {
    const found = await this.txn.db().participacao.findUnique({
      where: { gestacao_id_usuario_id: { gestacao_id: gestacaoId, usuario_id: usuarioId } },
    });
    return found !== null;
  }

  async create(data: CriarParticipacao): Promise<void> {
    await this.txn.db().participacao.create({
      data: { ...data, status_convite: 'aceito' },
    });
  }

  async findByUsuario(usuarioId: number): Promise<Participacao[]> {
    const rows = await this.txn.db().participacao.findMany({ where: { usuario_id: usuarioId } });
    return rows.map((r) => ({ gestacao_id: r.gestacao_id, papel: r.papel as PapelConvite }));
  }
}
