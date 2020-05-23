import { randomBytes } from 'crypto';
import { EmailToken } from './email-token.entity';

const mockCode = 'MOCK CODE';
jest.mock('crypto', () => {
  return {
    randomBytes: jest.fn(() => mockCode),
  };
});
const mockUser: any = {
  id: 1,
  username: 'Mock User',
  email: 'mock@email.com',
};

jest.mock('./user.entity');

jest.mock('typeorm', () => ({
  BaseEntity: jest.fn(),
  BeforeInsert: jest.fn(),
  BeforeUpdate: jest.fn(),
  Column: jest.fn(),
  CreateDateColumn: jest.fn(),
  DeleteDateColumn: jest.fn(),
  UpdateDateColumn: jest.fn(),
  Entity: jest.fn(),
  ManyToOne: jest.fn((cb) => cb()),
  PrimaryGeneratedColumn: jest.fn(),
}));

describe('EmailTokenEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generateCode should generate a token and call randomBytes', async () => {
    const token = new EmailToken(mockUser);

    expect(token).toBeDefined();
    expect(token.user).toEqual(mockUser);
    expect(randomBytes).toHaveBeenCalledWith(32);
    expect(randomBytes).toHaveBeenCalledTimes(1);
    expect(token.code).toBe(mockCode);
  });
});
