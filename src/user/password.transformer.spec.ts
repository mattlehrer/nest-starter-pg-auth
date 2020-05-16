import * as bcrypt from 'bcryptjs';
import { fromHash, ROUNDS, toHash } from './password.transformer';

describe('Password Transformer', () => {
  it('fromHash should return the paramater unchanged', () => {
    const value = 'stored-hash';
    const result = fromHash(value);

    expect(result).toBe(value);
  });

  it('toHash should return the paramater hashed with bcrypt', () => {
    const fakePassword = 'fake-password';
    const fakeHash = bcrypt.hashSync(fakePassword, ROUNDS);
    const result = toHash(fakePassword);
    const rounds = bcrypt.getRounds(result);
    const salt = bcrypt.getSalt(result);

    expect(result).toBeDefined();
    expect(result).toHaveLength(60);
    expect(result).not.toBe(fakeHash);
    expect(rounds).toBe(ROUNDS);
    expect(salt).toBeDefined();
  });

  it('toHash should return parameter is null', () => {
    const fakePassword = null;
    const result = toHash(fakePassword);

    expect(result).toBeNull();
  });
});
