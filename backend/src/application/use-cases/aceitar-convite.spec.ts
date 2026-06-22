import { AceitarConvite } from './aceitar-convite';

function makeDeps(over: any = {}) {
  const futuro = new Date(Date.now() + 86400000);
  const convite = over.convite ?? { id: 3, gestacao_id: 9, papel: 'parceiro', status: 'pendente', expira_em: futuro, nome_gestante: 'Ana' };
  const txn = { run: jest.fn((work: any) => work()) };
  const usuario = 'usuario' in over ? over.usuario : { id: 42 };
  const usuarios = { findByAuthUid: jest.fn().mockResolvedValue(usuario) };
  const convites = { findByToken: jest.fn().mockResolvedValue(convite), markAceito: jest.fn().mockResolvedValue(undefined) };
  const participacoes = { exists: jest.fn().mockResolvedValue(over.jaParticipa ?? false), create: jest.fn().mockResolvedValue(undefined) };
  return { uc: new AceitarConvite(txn as any, usuarios as any, convites as any, participacoes as any), usuarios, convites, participacoes };
}

describe('AceitarConvite', () => {
  it('cria participação (papel do convite, data_entrada hoje) e marca convite aceito', async () => {
    const d = makeDeps();
    const res = await d.uc.execute('uid', 'tk');
    expect(d.participacoes.create).toHaveBeenCalledWith(expect.objectContaining({ gestacao_id: 9, usuario_id: 42, papel: 'parceiro' }));
    expect(d.convites.markAceito).toHaveBeenCalledWith(3, expect.any(Date));
    expect(res).toEqual({ gestacao_id: 9, papel: 'parceiro' });
  });

  it('410 quando convite não está pendente', async () => {
    const d = makeDeps({ convite: { id: 3, gestacao_id: 9, papel: 'parceiro', status: 'aceito', expira_em: new Date(Date.now() + 1000), nome_gestante: 'Ana' } });
    await expect(d.uc.execute('uid', 'tk')).rejects.toMatchObject({ status: 410 });
  });

  it('404 quando o usuário ainda não existe (sem /me prévio)', async () => {
    const d = makeDeps({ usuario: null });
    await expect(d.uc.execute('uid', 'tk')).rejects.toMatchObject({ status: 404 });
  });

  it('409 quando já participa', async () => {
    const d = makeDeps({ jaParticipa: true });
    await expect(d.uc.execute('uid', 'tk')).rejects.toMatchObject({ status: 409 });
    expect(d.participacoes.create).not.toHaveBeenCalled();
  });
});
