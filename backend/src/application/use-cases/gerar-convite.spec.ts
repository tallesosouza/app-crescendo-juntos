import { GerarConvite } from './gerar-convite';

function makeDeps(gestacoes: any[] = [{ id: 9 }], usuario: any = { id: 7 }) {
  const usuariosRepo = { findByAuthUid: jest.fn().mockResolvedValue(usuario) };
  const gestacoesRepo = { findByGestante: jest.fn().mockResolvedValue(gestacoes) };
  const convitesRepo = { create: jest.fn().mockImplementation((d) => Promise.resolve({ ...d })) };
  return { uc: new GerarConvite(usuariosRepo as any, gestacoesRepo as any, convitesRepo as any), convitesRepo };
}

describe('GerarConvite', () => {
  it('cria convite com token e expira_em +7d e url_relativa', async () => {
    const d = makeDeps();
    const res = await d.uc.execute('uid', 'familia');
    expect(d.convitesRepo.create).toHaveBeenCalledWith(expect.objectContaining({ gestacao_id: 9, papel: 'familia', criado_por: 7 }));
    expect(res.url_relativa).toBe(`/convite/${res.token}`);
    const dias = (new Date(res.expira_em).getTime() - Date.now()) / 86400000;
    expect(dias).toBeGreaterThan(6.9);
    expect(dias).toBeLessThan(7.1);
  });

  it('400 quando o usuário não tem gestação', async () => {
    const d = makeDeps([]);
    await expect(d.uc.execute('uid', 'parceiro')).rejects.toMatchObject({ status: 400 });
  });
});
