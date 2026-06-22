export interface TransactionPort {
  run<T>(work: () => Promise<T>): Promise<T>;
}
export const TRANSACTION = Symbol('TransactionPort');
