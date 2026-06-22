import { BadRequestError } from '../errors/app-error';

const RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  readonly value: string;
  constructor(valor: string) {
    const v = (valor ?? '').trim().toLowerCase();
    if (!RE.test(v)) {
      throw new BadRequestError('E-mail inválido');
    }
    this.value = v;
  }
}
