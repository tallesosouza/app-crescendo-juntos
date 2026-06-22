import { ConflictError, GoneError, NotFoundError } from '../../domain/errors/app-error';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { ConviteRepository } from '../../domain/repositories/convite.repository';
import { ParticipacaoRepository } from '../../domain/repositories/participacao.repository';
import { TransactionPort } from '../ports/transaction.port';
import type { AceitarConviteResponse } from '@crescendo/shared';

export class AceitarConvite {
  constructor(
    private readonly txn: TransactionPort,
    private readonly usuarios: UsuarioRepository,
    private readonly convites: ConviteRepository,
    private readonly participacoes: ParticipacaoRepository,
  ) {}

  async execute(authUid: string, token: string): Promise<AceitarConviteResponse> {
    return this.txn.run(async () => {
      const convite = await this.convites.findByToken(token);
      if (!convite) throw new NotFoundError('Convite não encontrado');
      if (convite.status !== 'pendente' || convite.expira_em.getTime() < Date.now()) {
        throw new GoneError('Convite expirado ou já utilizado');
      }

      const usuario = await this.usuarios.findByAuthUid(authUid);
      if (!usuario) throw new NotFoundError('Usuário não encontrado');

      if (await this.participacoes.exists(convite.gestacao_id, usuario.id)) {
        throw new ConflictError('Usuário já participa desta gestação');
      }

      await this.participacoes.create({
        gestacao_id: convite.gestacao_id,
        usuario_id: usuario.id,
        papel: convite.papel,
        data_entrada: new Date(),
      });
      await this.convites.markAceito(convite.id, new Date());

      return { gestacao_id: convite.gestacao_id, papel: convite.papel };
    });
  }
}
