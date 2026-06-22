import { Dpp } from '../../domain/value-objects/dpp';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { GestacaoRepository } from '../../domain/repositories/gestacao.repository';
import { ParticipacaoRepository } from '../../domain/repositories/participacao.repository';
import { AuthUser } from '../ports/token-verifier.port';
import type { MeResponse } from '@crescendo/shared';

export class ObterContextoUsuario {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly gestacoes: GestacaoRepository,
    private readonly participacoes: ParticipacaoRepository,
  ) {}

  async execute(user: AuthUser): Promise<MeResponse> {
    let usuario = await this.usuarios.findByAuthUid(user.auth_uid);
    if (!usuario) {
      usuario = await this.usuarios.create({
        auth_uid: user.auth_uid,
        nome: user.nome ?? user.email,
        email: user.email,
      });
    }

    const hoje = new Date();
    const gestacoes = await this.gestacoes.findByGestante(usuario.id);
    const participacoes = await this.participacoes.findByUsuario(usuario.id);

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      data_nascimento: usuario.data_nascimento ? usuario.data_nascimento.toISOString().slice(0, 10) : null,
      municipio_id: usuario.municipio_id,
      consentimento_em: usuario.consentimento_em ? usuario.consentimento_em.toISOString() : null,
      tem_onboarding: gestacoes.length > 0 || participacoes.length > 0,
      gestacoes: gestacoes.map((g) => ({
        id: g.id,
        dpp: g.dpp.toISOString().slice(0, 10),
        status: g.status,
        semana_atual: Dpp.fromISO(g.dpp.toISOString()).semanaAtual(hoje),
      })),
      participacoes,
    };
  }
}
