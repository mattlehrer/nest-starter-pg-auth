import cases = require('jest-in-case');
import { StrongPassword } from './is-strong-password.decorator';

function casify(obj) {
  return Object.entries(obj).map(([name, password]) => ({
    name: `${password} - ${name}`,
    password,
  }));
}

describe('StrongPassword', () => {
  let strongPassword;

  beforeEach(async () => {
    strongPassword = new StrongPassword();
  });

  it('should be defined', () => {
    expect(strongPassword).toBeDefined();
  });

  it('should have a default message', () => {
    expect(strongPassword.defaultMessage()).toMatchInlineSnapshot(
      `"Password must be at least 8 characters and include one lowercase letter, one uppercase letter, and one digit."`,
    );
  });

  describe('validate', () => {
    cases(
      'valid passwords',
      ({ password }) => {
        expect(strongPassword.validate(password)).toBe(true);
      },
      casify({
        'valid password': '!aBc1234',
        'does not require non-alphanumeric characters': 'ABCdef123',
      }),
    );

    cases(
      'isPasswordAllowed: invalid passwords',
      ({ password }) => {
        expect(strongPassword.validate(password)).toBe(false);
      },
      casify({
        'too short': 'a2c!',
        'no letters': '12345678',
        'no numbers': 'ABCdefgh',
        'no uppercase letters': 'abc1234!',
        'no lowercase letters': 'ABC1234!',
      }),
    );
  });
});
