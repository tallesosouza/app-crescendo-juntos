import { PasswordResetGateway } from '../../application/ports/password-reset-gateway.port';

export class SupabaseAuthGateway implements PasswordResetGateway {
  async enviar(email: string): Promise<void> {
    const url = `${process.env.SUPABASE_URL}/auth/v1/recover`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      throw new Error(`Supabase recover falhou: ${res.status}`);
    }
  }
}
