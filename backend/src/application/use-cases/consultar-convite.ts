import { GoneError, NotFoundError } from '../../domain/errors/app-error';
import { ConviteRepository } from '../../domain/repositories/convite.repository';
import type { ConsultarConviteResponse } from '@crescendo/shared';

export class ConsultarConvite {
  constructor(private readonly convites: ConviteRepository) {}

  async execute(token: string): Promise<ConsultarConviteResponse> {
    const c = await this.convites.findByToken(token);
    if (!c) throw new NotFoundError('Convite não encontrado');
    if (c.status !== 'pendente' || c.expira_em.getTime() < Date.now()) {
      throw new GoneError('Convite expirado ou já utilizado');
    }
    return { papel: c.papel, nome_gestante: c.nome_gestante };
  }
}
