import { Dpp } from './dpp';

describe('Dpp', () => {
  it('semanaAtual: na DPP exata faltam 0 dias → semana 40', () => {
    const hoje = new Date('2026-06-22');
    const dpp = Dpp.fromISO('2026-06-22');
    expect(dpp.semanaAtual(hoje)).toBe(40);
  });

  it('semanaAtual: faltando 70 dias (10 semanas) → semana 30', () => {
    const hoje = new Date('2026-06-22');
    const dpp = Dpp.fromISO('2026-08-31'); // +70 dias
    expect(dpp.semanaAtual(hoje)).toBe(30);
  });

  it('fromSemanas: "estou em 12 semanas" → DPP = hoje + (40-12)*7 dias', () => {
    const hoje = new Date('2026-06-22');
    const dpp = Dpp.fromSemanas(12, hoje);
    // 28 semanas * 7 = 196 dias
    expect(dpp.value.toISOString().slice(0, 10)).toBe('2027-01-04');
    expect(dpp.semanaAtual(hoje)).toBe(12);
  });

  it('fromISO inválida lança erro', () => {
    expect(() => Dpp.fromISO('não-é-data')).toThrow();
  });
});
