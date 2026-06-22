import { Injectable } from '@nestjs/common';
import { PrismaTransaction } from '../prisma/prisma-transaction';
import { Municipio } from '../../domain/entities/municipio';
import { MunicipioRepository } from '../../domain/repositories/municipio.repository';

@Injectable()
export class MunicipioPrismaRepository implements MunicipioRepository {
  constructor(private readonly txn: PrismaTransaction) {}

  async findAll(): Promise<Municipio[]> {
    return this.txn.db().municipio.findMany({
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, uf: true },
    });
  }
}
