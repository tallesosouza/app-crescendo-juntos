import { Email } from '../../domain/value-objects/email';
import { PasswordResetGateway } from '../ports/password-reset-gateway.port';

export class SolicitarRedefinicaoSenha {
  constructor(private readonly gateway: PasswordResetGateway) {}

  async execute(email: string): Promise<void> {
    const e = new Email(email); // lança 400 se inválido
    try {
      await this.gateway.enviar(e.value);
    } catch {
      // não revela se o e-mail existe / se o Supabase falhou
    }
  }
}
