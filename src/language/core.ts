import { any, map, oneOrMany, opt, regex, seq, str, wspaces } from 'parser-combinators/parsers';
import { Parser } from 'parser-combinators/types';

import { Type } from './interfaces';

export const typeDef = (expects: string): Parser<string> => regex(/[a-zA-Z][\w\d]*/, expects);
export const type = (expects: string): Parser<Type> => map(seq(regex(/[a-zA-Z][\w\d]*/, expects), opt(str('[]'))), ([name, array]) => ({ kind: 'type', name, isArray: !!array}));
export const name = (expects: string): Parser<string> => regex(/[a-zA-Z_][\w\d]*/, expects);

export const functionReturnType = type('function return type');
export const parameterType = type('parameter type');
export const objectName = typeDef('object name');
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