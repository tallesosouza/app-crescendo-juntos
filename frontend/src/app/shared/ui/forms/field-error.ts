import type { FieldState } from '@angular/forms/signals';

/** Primeira mensagem de erro do campo, só quando já foi tocado; senão null. */
export function fieldError(field: () => FieldState<any>): string | null {
  const state = field();
  if (!state.touched()) return null;
  const errors = state.errors();
  return errors.length ? (errors[0].message ?? 'Valor inválido') : null;
}
