import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaTransaction } from '../prisma/prisma-transaction';
import { UsuarioPrismaRepository } from './usuario.prisma-repository';
import { GestacaoPrismaRepository } from './gestacao.prisma-repository';
import { ConvitePrismaRepository } from './convite.prisma-repository';

describe('Repositórios Prisma (integração)', () => {
  const prisma = new PrismaService();
  const txn = new PrismaTransaction(prisma);
  const usuarios = new UsuarioPrismaRepository(txn);
  const gestacoes = new GestacaoPrismaRepository(txn);
  const convites = new ConvitePrismaRepository(txn);

  beforeAll(async () => { await prisma.$connect(); });
  afterAll(async () => { await prisma.$disconnect(); });

  it('cria usuário e encontra por auth_uid', async () => {
    const auth_uid = randomUUID();
    const email = `t_${auth_uid}@ex.com`;
    const u = await usuarios.create({ auth_uid, nome: 'Ana', email });
    const found = await usuarios.findByAuthUid(auth_uid);
    expect(found?.id).toBe(u.id);
    await prisma.usuario.delete({ where: { id: u.id } });
  });

  it('run() faz rollback ao lançar erro (atomicidade)', async () => {
    const auth_uid = randomUUID();
    const email = `r_${auth_uid}@ex.com`;
    await expect(
      txn.run(async () => {
        await usuarios.create({ auth_uid, nome: 'Rollback', email });
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(await usuarios.findByAuthUid(auth_uid)).toBeNull();
  });

  it('convite.findByToken traz o nome da gestante', async () => {
    const auth_uid = randomUUID();
    const u = await usuarios.create({ auth_uid, nome: 'Bia', email: `b_${auth_uid}@ex.com` });
    const g = await gestacoes.create({ gestante_id: u.id, dpp: new Date('2026-12-01'), status: 'gestacao' });
    const token = randomUUID();
    await convites.create({ gestacao_id: g.id, papel: 'parceiro', token, expira_em: new Date(Date.now() + 86400000), criado_por: u.id });
    const found = await convites.findByToken(token);
    expect(found?.nome_gestante).toBe('Bia');
    await prisma.convite.deleteMany({ where: { gestacao_id: g.id } });
    await prisma.gestacao.delete({ where: { id: g.id } });
    await prisma.usuario.delete({ where: { id: u.id } });
  });
});
