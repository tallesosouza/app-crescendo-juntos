import { SolicitarRedefinicaoSenha } from './solicitar-redefinicao-senha';

describe('SolicitarRedefinicaoSenha', () => {
  it('chama o gateway com o e-mail normalizado', async () => {
    const gw = { enviar: jest.fn().mockResolvedValue(undefined) };
    await new SolicitarRedefinicaoSenha(gw as any).execute('Ana@Ex.COM');
    expect(gw.enviar).toHaveBeenCalledWith('ana@ex.com');
  });

  it('não vaza falha do gateway (resolve mesmo se o envio falhar)', async () => {
    const gw = { enviar: jest.fn().mockRejectedValue(new Error('supabase down')) };
    await expect(new SolicitarRedefinicaoSenha(gw as any).execute('ana@ex.com')).resolves.toBeUndefined();
  });

  it('rejeita e-mail inválido (400)', async () => {
    const gw = { enviar: jest.fn() };
    await expect(new SolicitarRedefinicaoSenha(gw as any).execute('invalido')).rejects.toMatchObject({ status: 400 });
    expect(gw.enviar).not.toHaveBeenCalled();
  });
});
