import { RealizarOnboardingGestante } from './realizar-onboarding-gestante';

function makeDeps(usuario: any = { id: 7, auth_uid: 'uid' }) {
  const txn = { run: jest.fn((work: any) => work()) };
  const usuarios = { findByAuthUid: jest.fn().mockResolvedValue(usuario), updatePerfil: jest.fn().mockResolvedValue(usuario) };
  const gestacoes = { create: jest.fn().mockResolvedValue({ id: 55 }) };
  const bebes = { create: jest.fn().mockResolvedValue({ id: 1 }) };
  const convites = { create: jest.fn().mockResolvedValue({ token: 'tk', papel: 'parceiro', expira_em: new Date('2026-07-01') }) };
  const uc = new RealizarOnboardingGestante(txn as any, usuarios as any, gestacoes as any, bebes as any, convites as any);
  return { uc, txn, usuarios, gestacoes, bebes, convites };
}

const perfil = { nome: 'Ana', data_nascimento: '1995-05-05', municipio_id: 1, aceite_termos: true, versao_termos: 'v1' };

describe('RealizarOnboardingGestante', () => {
  it('atualiza perfil + cria gestação; sem bebê e sem convite', async () => {
    const d = makeDeps();
    const res = await d.uc.execute('uid', { perfil, gestacao: { dpp: '2026-12-01' } });
    expect(d.usuarios.updatePerfil).toHaveBeenCalledWith(7, expect.objectContaining({ nome: 'Ana', municipio_id: 1, versao_termos: 'v1' }));
    expect(d.gestacoes.create).toHaveBeenCalledWith(expect.objectContaining({ gestante_id: 7, status: 'gestacao' }));
    expect(d.bebes.create).not.toHaveBeenCalled();
    expect(res).toEqual({ gestacao_id: 55, convites: [] });
  });

  it('cria bebê quando há dado e converte X semanas em DPP', async () => {
    const d = makeDeps();
    await d.uc.execute('uid', { perfil, gestacao: { semanas: 12 }, bebe: { nome: 'Bebê' } });
    expect(d.bebes.create).toHaveBeenCalledWith(expect.objectContaining({ gestacao_id: 55, nome: 'Bebê' }));
  });

  it('cria convites opcionais e os retorna', async () => {
    const d = makeDeps();
    const res = await d.uc.execute('uid', { perfil, gestacao: { dpp: '2026-12-01' }, convites: [{ papel: 'parceiro' }] });
    expect(d.convites.create).toHaveBeenCalledTimes(1);
    expect(res.convites).toHaveLength(1);
    expect(res.convites[0]).toMatchObject({ papel: 'parceiro', url_relativa: expect.stringContaining('/convite/') });
  });

  it('recusa quando não aceita os termos', async () => {
    const d = makeDeps();
    await expect(d.uc.execute('uid', { perfil: { ...perfil, aceite_termos: false }, gestacao: { dpp: '2026-12-01' } }))
      .rejects.toMatchObject({ status: 400 });
  });

  it('recusa quando não há gestação válida (nem dpp nem semanas)', async () => {
    const d = makeDeps();
    await expect(d.uc.execute('uid', { perfil, gestacao: {} as any })).rejects.toMatchObject({ status: 400 });
  });

  it('404 quando o usuário não existe (sem /me prévio)', async () => {
    const d = makeDeps(null);
    await expect(d.uc.execute('uid', { perfil, gestacao: { dpp: '2026-12-01' } })).rejects.toMatchObject({ status: 404 });
  });
});
