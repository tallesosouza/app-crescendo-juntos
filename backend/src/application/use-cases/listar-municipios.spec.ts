import { ListarMunicipios } from './listar-municipios';

describe('ListarMunicipios', () => {
  it('retorna o catálogo do repositório', async () => {
    const repo = { findAll: jest.fn().mockResolvedValue([{ id: 1, nome: 'Ilhéus', uf: 'BA' }]) };
    const uc = new ListarMunicipios(repo as any);
    expect(await uc.execute()).toEqual([{ id: 1, nome: 'Ilhéus', uf: 'BA' }]);
  });
});
