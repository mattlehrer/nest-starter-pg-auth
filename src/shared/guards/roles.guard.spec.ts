import { Role } from '../interfaces/roles.enum';
import { RolesGuard } from './roles.guard';

const reflector = {
  get: jest.fn(),
  getAll: jest.fn(),
  getAllAndMerge: jest.fn(),
  getAllAndOverride: jest.fn(),
};

const context = {
  getClass: jest.fn(),
  getHandler: jest.fn(),
  getArgs: jest.fn(),
  getArgByIndex: jest.fn(),
  switchToRpc: jest.fn(),
  switchToHttp: jest.fn(),
  switchToWs: jest.fn(),
  getType: jest.fn(),
};

describe('RolesGuard', () => {
  let rolesGuard;

  beforeEach(async () => {
    rolesGuard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(rolesGuard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if no roles', () => {
      reflector.get.mockReturnValueOnce(undefined);

      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true if user has a matching role', () => {
      const roles = [Role.USER];
      const user = {
        roles: [Role.USER, Role.ADMIN],
      };
      reflector.get.mockReturnValueOnce(roles);
      context.switchToHttp.mockReturnValueOnce({
        getRequest: jest.fn().mockReturnValueOnce({ user }),
      });

      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false if user does not have a matching role', () => {
      const roles = [Role.ADMIN];
      const user = {
        roles: [Role.USER],
      };
      reflector.get.mockReturnValueOnce(roles);
      context.switchToHttp.mockReturnValueOnce({
        getRequest: jest.fn().mockReturnValueOnce({ user }),
      });

      const result = rolesGuard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
