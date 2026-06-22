import { PrismaClient } from '@prisma/client';
import { seedMunicipios } from './seed';

describe('seedMunicipios', () => {
  const prisma = new PrismaClient();
  afterAll(async () => { await prisma.$disconnect(); });

  it('é idempotente: rodar duas vezes não duplica Ilhéus', async () => {
    await seedMunicipios(prisma);
    await seedMunicipios(prisma);
    const ilheus = await prisma.municipio.findMany({ where: { codigo_ibge: '2913606' } });
    expect(ilheus).toHaveLength(1);
  });
});
