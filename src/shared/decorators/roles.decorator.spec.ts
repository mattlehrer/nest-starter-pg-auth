import { SetMetadata } from '@nestjs/common';
import { Roles } from './roles.decorator';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn(),
}));

describe('Roles Decorator', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should call SetMetadata', () => {
    const roles = ['MOCK', 'ROLES'];

    Roles(...roles);

    expect(SetMetadata).toHaveBeenCalledWith('roles', roles);
    expect(SetMetadata).toHaveReturnedTimes(1);
  });
});
