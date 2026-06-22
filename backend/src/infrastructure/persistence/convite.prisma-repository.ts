import { Injectable } from '@nestjs/common';
import { PrismaTransaction } from '../prisma/prisma-transaction';
import { Convite, ConviteComGestante, PapelConvite } from '../../domain/entities/convite';
import { ConviteRepository, CriarConvite } from '../../domain/repositories/convite.repository';

@Injectable()
export class ConvitePrismaRepository implements ConviteRepository {
  constructor(private readonly txn: PrismaTransaction) {}

  async create(data: CriarConvite): Promise<Convite> {
    return this.txn.db().convite.create({ data }) as Promise<Convite>;
  }

  async findByToken(token: string): Promise<ConviteComGestante | null> {
    const row = await this.txn.db().convite.findUnique({
      where: { token },
      include: { gestacao: { include: { gestante: true } } },
    });
    if (!row) return null;
    return {
      id: row.id,
      gestacao_id: row.gestacao_id,
      papel: row.papel as PapelConvite,
      status: row.status,
      expira_em: row.expira_em,
      nome_gestante: row.gestacao.gestante.nome,
    };
  }

  async markAceito(id: number, aceito_em: Date): Promise<void> {
    await this.txn.db().convite.update({ where: { id }, data: { status: 'aceito', aceito_em } });
  }
}
