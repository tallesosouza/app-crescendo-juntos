import { Email } from './email';

describe('Email', () => {
  it('aceita e-mail válido e normaliza para minúsculas', () => {
    expect(new Email('Ana@Exemplo.COM').value).toBe('ana@exemplo.com');
  });
  it('rejeita e-mail inválido', () => {
    expect(() => new Email('sem-arroba')).toThrow();
  });
});
