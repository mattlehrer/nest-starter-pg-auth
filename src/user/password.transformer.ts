import * as bcrypt from 'bcryptjs';

export const ROUNDS = 10;

export function fromHash(value: string): string {
  return value;
}

export function toHash(value: string): string {
  return value ? bcrypt.hashSync(value, ROUNDS) : value;
}
