import { any, oneOrMany, regex, seq, wspaces } from 'parser-combinators/parsers';
import { Parser } from 'parser-combinators/types';

export const type = (expects: string): Parser<string> => regex(/[a-zA-Z][\w\d]*/, expects);
export const name = (expects: string): Parser<string> => regex(/[a-zA-Z_][\w\d]*/, expects);

export const functionReturnType = type('function return type');
export const parameterType = type('parameter type');
export const objectName = type('object name');
export const variableType = type('variable type');
export const variableName = name('variable name');
export const parameterName = name('parameter name');
export const functionName = name('function name');

export const wspacesOrComment = any(oneOrMany(
  any(
    seq(regex(/^(?:\s|\t|\n|\r)*\/\/.*?$/m, 'line comment'), wspaces),
    seq(wspaces, regex(/\/\*.*?\*\//ms, 'block comment'), wspaces)
  ),
  wspaces
), wspaces);