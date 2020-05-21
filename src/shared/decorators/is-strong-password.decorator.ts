import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'strongPassword', async: false })
export class StrongPassword implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    return (
      typeof password === 'string' &&
      password.length >= 8 &&
      password.length <= 100 &&
      !!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
    );
  }

  defaultMessage(): string {
    return 'Password must be at least 8 characters and include one lowercase letter, one uppercase letter, and one digit.';
  }
}

export function IsStrongPassword(
  validationOptions?: ValidationOptions,
): (object: any, propertyName: string) => void {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: StrongPassword,
    });
  };
}
