import { IsSiblingOfConstraint } from './is-required-with.decorator';

import cases = require('jest-in-case');

const mockObject = {
  username: 'USERNAME',
  email: 'EMAIL',
  isActive: true,
  oldPassword: 'PASS',
  newPassword: 'NEW_PASS',
  notDefined: undefined,
  alsoNotDefined: undefined,
  isNull: null,
  ['']: 'empty string key',
};

type Case = {
  [key: string]: {
    property: string;
    constraints: string[];
    object: any;
  };
};

function casify(obj: Case): any[] {
  return Object.entries(obj).map(([name, args]) => {
    return {
      name: `${args.property} with ${name}: ${args.constraints.join(', ')}`,
      args,
    };
  });
}

describe('IsSiblingOfConstraint', () => {
  let isSiblingOfConstraint;

  beforeEach(async () => {
    isSiblingOfConstraint = new IsSiblingOfConstraint();
  });

  it('should be defined', () => {
    expect(isSiblingOfConstraint).toBeDefined();
  });

  it('should have a default message', () => {
    const args = {
      property: 'property',
      constraints: ['notDefined'],
      object: mockObject,
    };

    expect(isSiblingOfConstraint.defaultMessage(args)).toMatchInlineSnapshot(
      `"property must exist alongside the following defined properties: notDefined"`,
    );
  });

  describe('validate', () => {
    cases(
      'should be true when property is not defined',
      ({ args }) => {
        expect(
          isSiblingOfConstraint.validate(args.object[args.property], args),
        ).toBe(true);
      },
      casify({
        'one sibling that is defined': {
          property: 'notDefined',
          constraints: ['oldPassword'],
          object: mockObject,
        },
        'one of two siblings is undefined': {
          property: 'notDefined',
          constraints: ['oldPassword', 'alsoNotDefined'],
          object: mockObject,
        },
        'null sibling': {
          property: 'notDefined',
          constraints: ['oldPassword', 'isNull'],
          object: mockObject,
        },
      }),
    );

    cases(
      'should be true when property exists alongside all siblings',
      ({ args }) => {
        expect(
          isSiblingOfConstraint.validate(args.object[args.property], args),
        ).toBe(true);
      },
      casify({
        'one sibling': {
          property: 'username',
          constraints: ['oldPassword'],
          object: mockObject,
        },
        'one sibling with an empty string': {
          property: 'isActive',
          constraints: [''],
          object: mockObject,
        },
        'two siblings': {
          property: 'newPassword',
          constraints: ['oldPassword', 'email'],
          object: mockObject,
        },
      }),
    );

    cases(
      'should be false when property exists without all siblings',
      ({ args }) => {
        expect(
          isSiblingOfConstraint.validate(args.object[args.property], args),
        ).toBe(false);
      },
      casify({
        'one sibling that is undefined': {
          property: 'username',
          constraints: ['notDefined'],
          object: mockObject,
        },
        'one of two siblings is undefined': {
          property: 'newPassword',
          constraints: ['oldPassword', 'notDefined'],
          object: mockObject,
        },
        'one of two siblings is null': {
          property: 'newPassword',
          constraints: ['oldPassword', 'isNull'],
          object: mockObject,
        },
      }),
    );
  });
});
