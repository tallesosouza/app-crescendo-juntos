import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { TransactionPort } from '../../application/ports/transaction.port';

@Injectable()
export class PrismaTransaction implements TransactionPort {
  private readonly als = new AsyncLocalStorage<Prisma.TransactionClient>();

  constructor(private readonly prisma: PrismaService) {}

  /** Client ciente da transação: o client da tx ativa, ou o root fora dela. */
  db(): Prisma.TransactionClient {
    return this.als.getStore() ?? this.prisma;
  }

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => this.als.run(tx, work));
  }
}
