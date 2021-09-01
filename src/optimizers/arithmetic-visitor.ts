import { BasicOperatorsEnum, ComparisonOperatorsEnum, OrderingOperatorsEnum } from '../language/arithmetic-operators';
import { ArithmeticStatement, ASTStatement } from '../language/interfaces';

type OperatorStorage = {
  [key in BasicOperatorsEnum]: (x: number, y: number) => number
} & {
  [key in ComparisonOperatorsEnum]: (x: unknown, y: unknown) => boolean
} & {
  [key in OrderingOperatorsEnum]: (x: number | string, y: number | string) => boolean;
};

const operators: OperatorStorage = {
  '+': (x: number, y: number): number => x + y,
  '-': (x: number, y: number): number => x - y,
  '*': (x: number, y: number): number => x * y,
  '/': (x: number, y: number): number => x / y,
  '==': (x: unknown, y: unknown): boolean => x === y,
  '!=': (x: unknown, y: unknown): boolean => x !== y,
  '>=': (x: number | string, y: number | string): boolean => x >= y,
  '<=': (x: number | string, y: number | string): boolean => x <= y,
  '>': (x: number | string, y: number | string): boolean => x > y,
  '<': (x: number | string, y: number | string): boolean => x < y,
};

const numbers = ['intValue', 'realValue'];

const constants = [...numbers, 'stringValue', 'boolValue'];

export function arithmeticVisitor(node: ArithmeticStatement): ASTStatement {
  if (!constants.includes(node.left.kind) || !constants.includes(node.right.kind)) return node;
  if (node.operator === '=='
   || node.operator === '!='
   || node.operator === '>'
   || node.operator === '<'
   || node.operator === '>='
   || node.operator === '<=') {
    return {
      kind: 'boolValue',
      value: operators[node.operator]((node.left as {value: string | number}).value, (node.right as {value: string | number}).value),
    };
  } else {
    return {
      kind: node.left.kind === 'intValue' && node.right.kind === 'intValue' && node.operator !== '/' ? 'intValue' : 'realValue',
      value: operators[node.operator]((node.left as {value: number}).value, (node.right as {value: number}).value),
    };
  }
}