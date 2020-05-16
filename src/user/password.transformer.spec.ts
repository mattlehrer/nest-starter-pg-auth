import * as bcrypt from 'bcryptjs';
import { fromHash, ROUNDS, toHash } from './password.transformer';

describe('Password Transformer', () => {
  describe('fromHash', () => {
    it('fromHash should return the paramater unchanged', () => {
      const value = 'stored-hash';

      const result = fromHash(value);

      expect(result).toBe(value);
    });
  });

  describe('toHash', () => {
    it('when paramater is truthy, should return the paramater hashed with bcrypt', () => {
      const fakePassword = 'fake-password';
      const fakeHash = bcrypt.hashSync(fakePassword, ROUNDS);

      const result = toHash(fakePassword);

      expect(result).toBeDefined();
      expect(result).toHaveLength(60);
      expect(result).not.toBe(fakeHash);
      expect(bcrypt.getRounds(result)).toBe(ROUNDS);
      expect(bcrypt.getSalt(result)).toBeDefined();
    });

    it('when parameter is null, should return parameter', () => {
      const fakePassword = null;

      const result = toHash(fakePassword);

      expect(result).toBeNull();
    });
  });
});
