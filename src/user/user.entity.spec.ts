import * as bcrypt from 'bcryptjs';
import normalizeEmail from 'validator/lib/normalizeEmail';
import { User } from './user.entity';

const mockPassword = 'FAKE_PASSWORD';
const mockHash = 'FAKE_HASH';
jest.mock('bcryptjs', () => {
  return {
    hash: jest.fn(() => mockHash),
    compare: jest.fn(() => true),
  };
});

jest.mock('validator/lib/normalizeEmail');

describe('UserEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validatePassword should call bcrypt.compare', async () => {
    const user = new User();
    user.password = mockHash;

    const result = await user.validatePassword(mockPassword);

    expect(result).toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith(mockPassword, user.password);
    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
  });

  it('normalize should normalize username and password', async () => {
    const user = new User();
    user.email = 'test@Test.com';
    user.username = 'TestUser';

    user.normalize();

    expect(user.normalizedEmail).toBe(normalizeEmail(user.email));
    expect(user.normalizedEmail).not.toBe(user.email);
    expect(user.normalizedUsername).toBe(user.username.toLowerCase());
    expect(user.normalizedUsername).not.toBe(user.username);
  });
});
