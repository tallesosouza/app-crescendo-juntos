import { randomUUID } from 'node:crypto';
import { Dpp } from '../../domain/value-objects/dpp';
import { BadRequestError, NotFoundError } from '../../domain/errors/app-error';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { GestacaoRepository } from '../../domain/repositories/gestacao.repository';
import { BebeRepository } from '../../domain/repositories/bebe.repository';
import { ConviteRepository } from '../../domain/repositories/convite.repository';
import { TransactionPort } from '../ports/transaction.port';
import type { OnboardingGestanteRequest, OnboardingGestanteResponse, ConviteResponse } from '@crescendo/shared';

const SETE_DIAS_MS = 7 * 86_400_000;

export class RealizarOnboardingGestante {
  constructor(
    private readonly txn: TransactionPort,
    private readonly usuarios: UsuarioRepository,
    private readonly gestacoes: GestacaoRepository,
    private readonly bebes: BebeRepository,
    private readonly convites: ConviteRepository,
  ) {}

  async execute(authUid: string, input: OnboardingGestanteRequest): Promise<OnboardingGestanteResponse> {
    if (!input.perfil?.aceite_termos) {
      throw new BadRequestError('É necessário aceitar os termos');
    }
    const dpp = this.resolverDpp(input.gestacao);

    return this.txn.run(async () => {
      const usuario = await this.usuarios.findByAuthUid(authUid);
      if (!usuario) throw new NotFoundError('Usuário não encontrado');

      await this.usuarios.updatePerfil(usuario.id, {
        nome: input.perfil.nome,
        data_nascimento: new Date(input.perfil.data_nascimento),
        municipio_id: input.perfil.municipio_id,
        consentimento_em: new Date(),
        versao_termos: input.perfil.versao_termos,
      });

      const gestacao = await this.gestacoes.create({ gestante_id: usuario.id, dpp: dpp.value, status: 'gestacao' });

      if (input.bebe && (input.bebe.nome || input.bebe.sexo || input.bebe.data_nascimento)) {
        await this.bebes.create({
          gestacao_id: gestacao.id,
          nome: input.bebe.nome,
          sexo: input.bebe.sexo,
          data_nascimento: input.bebe.data_nascimento ? new Date(input.bebe.data_nascimento) : undefined,
        });
      }

      const convites: ConviteResponse[] = [];
      for (const c of input.convites ?? []) {
        const token = randomUUID();
        const expira_em = new Date(Date.now() + SETE_DIAS_MS);
        await this.convites.create({ gestacao_id: gestacao.id, papel: c.papel, token, expira_em, criado_por: usuario.id });
        convites.push({ token, papel: c.papel, expira_em: expira_em.toISOString(), url_relativa: `/convite/${token}` });
      }

      return { gestacao_id: gestacao.id, convites };
    });
  }

  private resolverDpp(g: OnboardingGestanteRequest['gestacao']): Dpp {
    const temDpp = typeof g?.dpp === 'string';
    const temSemanas = typeof g?.semanas === 'number';
    if (temDpp === temSemanas) {
      throw new BadRequestError('Informe exatamente um de dpp ou semanas');
    }
    return temDpp ? Dpp.fromISO(g.dpp as string) : Dpp.fromSemanas(g.semanas as number, new Date());
  }
}
