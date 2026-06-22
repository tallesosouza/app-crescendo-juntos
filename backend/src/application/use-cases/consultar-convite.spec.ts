import { ConsultarConvite } from './consultar-convite';

function repoCom(convite: any) {
  return { findByToken: jest.fn().mockResolvedValue(convite) };
}
const futuro = new Date(Date.now() + 86400000);

describe('ConsultarConvite', () => {
  it('retorna papel + nome da gestante para convite pendente', async () => {
    const repo = repoCom({ id: 1, gestacao_id: 9, papel: 'parceiro', status: 'pendente', expira_em: futuro, nome_gestante: 'Ana' });
    const uc = new ConsultarConvite(repo as any);
    expect(await uc.execute('tk')).toEqual({ papel: 'parceiro', nome_gestante: 'Ana' });
  });

  it('404 quando não existe', async () => {
    const uc = new ConsultarConvite(repoCom(null) as any);
    await expect(uc.execute('tk')).rejects.toMatchObject({ status: 404 });
  });

  it('410 quando já aceito', async () => {
    const repo = repoCom({ status: 'aceito', expira_em: futuro, papel: 'parceiro', nome_gestante: 'Ana' });
    await expect(new ConsultarConvite(repo as any).execute('tk')).rejects.toMatchObject({ status: 410 });
  });

  it('410 quando expirado', async () => {
    const repo = repoCom({ status: 'pendente', expira_em: new Date(Date.now() - 1000), papel: 'parceiro', nome_gestante: 'Ana' });
    await expect(new ConsultarConvite(repo as any).execute('tk')).rejects.toMatchObject({ status: 410 });
  });
});
