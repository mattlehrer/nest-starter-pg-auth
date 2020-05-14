import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

const mockPassword = 'FAKE_PASSWORD';
const mockHash = 'FAKE_HASH';
const mockSalt = 'FAKE_SALT';
jest.mock('bcryptjs', () => {
  return {
    hash: jest.fn(() => mockHash),
  };
});

describe('UserEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validatePassword', async () => {
    const user = new User();
    user.password = mockHash;
    user.salt = mockSalt;

    const result = await user.validatePassword(mockPassword);
    expect(result).toBe(true);
    expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, mockSalt);
    expect(bcrypt.hash).toHaveBeenCalledTimes(1);
  });
});
