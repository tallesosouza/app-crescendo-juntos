export interface AuthUser {
  auth_uid: string;
  email: string;
  nome: string | null;
}
export interface TokenVerifier {
  verify(token: string): Promise<AuthUser>;
}
export const TOKEN_VERIFIER = Symbol('TokenVerifier');
