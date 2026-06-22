import { Injectable } from '@nestjs/common';
import { PrismaTransaction } from '../prisma/prisma-transaction';
import { Gestacao } from '../../domain/entities/gestacao';
import { GestacaoRepository } from '../../domain/repositories/gestacao.repository';

@Injectable()
export class GestacaoPrismaRepository implements GestacaoRepository {
  constructor(private readonly txn: PrismaTransaction) {}

  async create(data: { gestante_id: number; dpp: Date; status: 'gestacao' }): Promise<Gestacao> {
    return this.txn.db().gestacao.create({ data }) as Promise<Gestacao>;
  }

  async findByGestante(gestanteId: number): Promise<Gestacao[]> {
    return this.txn.db().gestacao.findMany({ where: { gestante_id: gestanteId } }) as Promise<Gestacao[]>;
  }
}
