import { ObterContextoUsuario } from './obter-contexto-usuario';

const baseUsuario = {
  id: 1, auth_uid: 'uid', nome: 'Ana', email: 'ana@ex.com',
  data_nascimento: null, municipio_id: null, consentimento_em: null, versao_termos: null,
};

function makeRepos(overrides: Partial<{ usuario: any; gestacoes: any[]; participacoes: any[] }> = {}) {
  const usuario = overrides.usuario ?? null;
  const created = { ...baseUsuario };
  return {
    usuarios: {
      findByAuthUid: jest.fn().mockResolvedValue(usuario),
      create: jest.fn().mockResolvedValue(created),
      updatePerfil: jest.fn(),
    },
    gestacoes: { findByGestante: jest.fn().mockResolvedValue(overrides.gestacoes ?? []) },
    participacoes: { findByUsuario: jest.fn().mockResolvedValue(overrides.participacoes ?? []) },
  };
}

describe('ObterContextoUsuario', () => {
  it('cria o usuário no primeiro acesso (upsert) usando nome do JWT', async () => {
    const r = makeRepos({ usuario: null });
    const uc = new ObterContextoUsuario(r.usuarios as any, r.gestacoes as any, r.participacoes as any);
    const res = await uc.execute({ auth_uid: 'uid', email: 'ana@ex.com', nome: 'Ana' });
    expect(r.usuarios.create).toHaveBeenCalledWith({ auth_uid: 'uid', nome: 'Ana', email: 'ana@ex.com' });
    expect(res.tem_onboarding).toBe(false);
  });

  it('usa o email como nome quando o JWT não traz nome', async () => {
    const r = makeRepos({ usuario: null });
    const uc = new ObterContextoUsuario(r.usuarios as any, r.gestacoes as any, r.participacoes as any);
    await uc.execute({ auth_uid: 'uid', email: 'ana@ex.com', nome: null });
    expect(r.usuarios.create).toHaveBeenCalledWith({ auth_uid: 'uid', nome: 'ana@ex.com', email: 'ana@ex.com' });
  });

  it('não recria usuário existente e marca tem_onboarding quando há participação', async () => {
    const r = makeRepos({ usuario: baseUsuario, participacoes: [{ gestacao_id: 9, papel: 'parceiro' }] });
    const uc = new ObterContextoUsuario(r.usuarios as any, r.gestacoes as any, r.participacoes as any);
    const res = await uc.execute({ auth_uid: 'uid', email: 'ana@ex.com', nome: 'Ana' });
    expect(r.usuarios.create).not.toHaveBeenCalled();
    expect(res.tem_onboarding).toBe(true);
    expect(res.participacoes).toEqual([{ gestacao_id: 9, papel: 'parceiro' }]);
  });
});
