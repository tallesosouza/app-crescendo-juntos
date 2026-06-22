import { BadRequestError } from '../errors/app-error';

const MS_POR_DIA = 86_400_000;
const DIAS_GESTACAO = 280; // 40 semanas

export class Dpp {
  private constructor(readonly value: Date) {}

  static fromISO(iso: string): Dpp {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestError('DPP inválida');
    }
    return new Dpp(d);
  }

  static fromSemanas(semanas: number, hoje: Date): Dpp {
    if (!Number.isFinite(semanas) || semanas < 0 || semanas > 42) {
      throw new BadRequestError('Semana gestacional inválida');
    }
    const restantes = (40 - semanas) * 7;
    return new Dpp(new Date(hoje.getTime() + restantes * MS_POR_DIA));
  }

  semanaAtual(hoje: Date): number {
    const diasRestantes = Math.ceil((this.value.getTime() - hoje.getTime()) / MS_POR_DIA);
    return 40 - Math.ceil(diasRestantes / 7);
  }
}
