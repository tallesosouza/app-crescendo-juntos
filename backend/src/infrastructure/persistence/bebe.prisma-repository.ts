import { Injectable } from '@nestjs/common';
import { PrismaTransaction } from '../prisma/prisma-transaction';
import { Bebe } from '../../domain/entities/bebe';
import { BebeRepository, CriarBebe } from '../../domain/repositories/bebe.repository';

@Injectable()
export class BebePrismaRepository implements BebeRepository {
  constructor(private readonly txn: PrismaTransaction) {}

  async create(data: CriarBebe): Promise<Bebe> {
    return this.txn.db().bebe.create({ data }) as Promise<Bebe>;
  }
}
