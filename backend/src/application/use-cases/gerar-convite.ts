import { randomUUID } from 'node:crypto';
import { BadRequestError, NotFoundError } from '../../domain/errors/app-error';
import { PapelConvite } from '../../domain/entities/convite';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { GestacaoRepository } from '../../domain/repositories/gestacao.repository';
import { ConviteRepository } from '../../domain/repositories/convite.repository';
import type { ConviteResponse } from '@crescendo/shared';

const SETE_DIAS_MS = 7 * 86_400_000;

export class GerarConvite {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly gestacoes: GestacaoRepository,
    private readonly convites: ConviteRepository,
  ) {}

  async execute(authUid: string, papel: PapelConvite): Promise<ConviteResponse> {
    const usuario = await this.usuarios.findByAuthUid(authUid);
    if (!usuario) throw new NotFoundError('Usuário não encontrado');

    const minhas = await this.gestacoes.findByGestante(usuario.id);
    if (minhas.length === 0) throw new BadRequestError('Usuário não possui gestação para convidar');

    const token = randomUUID();
    const expira_em = new Date(Date.now() + SETE_DIAS_MS);
    await this.convites.create({ gestacao_id: minhas[0].id, papel, token, expira_em, criado_por: usuario.id });
    return { token, papel, expira_em: expira_em.toISOString(), url_relativa: `/convite/${token}` };
  }
}
