import {
  isDefined,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Define new constraint that checks the existence of sibling properties
@ValidatorConstraint({ async: false })
export class IsSiblingOfConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (isDefined(value)) {
      return this.getFailedConstraints(args).length === 0;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${
      args.property
    } must exist alongside the following defined properties: ${this.getFailedConstraints(
      args,
    ).join(', ')}`;
  }

  getFailedConstraints(args: ValidationArguments): string[] {
    return args.constraints.filter((prop) => !isDefined(args.object[prop]));
  }
}

export function IsRequiredWith(
  props: string[],
  validationOptions?: ValidationOptions,
): (object: any, propertyName: string) => void {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      constraints: props,
      options: validationOptions,
      validator: IsSiblingOfConstraint,
    });
  };
}
