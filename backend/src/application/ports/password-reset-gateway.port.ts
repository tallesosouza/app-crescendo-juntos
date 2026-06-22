export interface PasswordResetGateway {
  enviar(email: string): Promise<void>;
}
export const PASSWORD_RESET_GATEWAY = Symbol('PasswordResetGateway');
