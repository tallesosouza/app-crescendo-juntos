import { PrismaService } from './prisma.service';

describe('Schema (smoke)', () => {
  const prisma = new PrismaService();

  beforeAll(async () => {
    await prisma.$connect();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('tem todas AS 20 tabelas do ER no schema public', async () => {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'`;
    expect(Number(rows[0].count)).toBe(20);
  });

  it('grava e lê um município (round-trip)', async () => {
    const m = await prisma.municipio.create({ data: { nome: 'Teste', uf: 'BA' } });
    const found = await prisma.municipio.findUnique({ where: { id: m.id } });
    expect(found?.nome).toBe('Teste');
    await prisma.municipio.delete({ where: { id: m.id } });
  });
});
