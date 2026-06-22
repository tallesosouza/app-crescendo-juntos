import { PrismaClient } from '@prisma/client';

const MUNICIPIOS = [
  { nome: 'Ilhéus', uf: 'BA', codigo_ibge: '2913606' },
  { nome: 'Itabuna', uf: 'BA', codigo_ibge: '2914802' },
  { nome: 'Salvador', uf: 'BA', codigo_ibge: '2927408' },
];

export async function seedMunicipios(prisma: PrismaClient): Promise<number> {
  for (const m of MUNICIPIOS) {
    const existing = await prisma.municipio.findFirst({ where: { codigo_ibge: m.codigo_ibge } });
    if (existing) {
      await prisma.municipio.update({ where: { id: existing.id }, data: m });
    } else {
      await prisma.municipio.create({ data: m });
    }
  }
  return MUNICIPIOS.length;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const n = await seedMunicipios(prisma);
    console.log(`Seed: ${n} municípios garantidos.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
