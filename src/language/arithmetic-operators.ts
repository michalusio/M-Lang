export type BasicOperators = '+' | '-' | '*' | '/';
export type ComparisonOperators = '==' | '!=';
export type OrderingOperators = '>' | '<' | '>=' | '<=';

export type Operators = BasicOperators | ComparisonOperators | OrderingOperators;

export enum BasicOperatorsEnum {
  'ADD'= '+',
  'SUBTRACT'= '-',
  'MULTIPLY'= '*',
  'DIVIDE'= '/'
}

export enum ComparisonOperatorsEnum {
  'EQUAL'= '==',
  'NOT_EQUAL'= '!='
}

export enum OrderingOperatorsEnum {
  'GREATER_THAN'= '>',
  'LESS_THAN'= '<',
  'GREATER_THAN_OR_EQUAL'= '>=',
  'LESS_THAN_OR_EQUAL'= '<='
}