import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

const mockPassword = 'FAKE_PASSWORD';
const mockHash = 'FAKE_HASH';
jest.mock('bcryptjs', () => {
  return {
    hash: jest.fn(() => mockHash),
    compare: jest.fn(() => true),
  };
});

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
});
