export type SexoBebe = 'masculino' | 'feminino' | 'indeterminado';

export interface Bebe {
  id: number;
  gestacao_id: number;
  nome: string | null;
  sexo: SexoBebe | null;
  data_nascimento: Date | null;
}
