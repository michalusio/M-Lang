import { between, map, oneOrMany, opt, seq, spacesPlus, str } from 'parser-combinators/parsers';
import { Parser } from 'parser-combinators/types';

import { functionName, functionReturnType, parameterName, parameterType, wspacesOrComment } from './core';
import { FunctionDeclaration, Parameter } from './interfaces';
import { scope } from './statements/code-statements';

function parameter(): Parser<Parameter> {
  return map(seq(wspacesOrComment, parameterType, wspacesOrComment, parameterName, wspacesOrComment), ([, type, , name]) => ({ kind: 'parameter', name, type }));
}

const parameters = oneOrMany(parameter(), str(','));

export function functionDeclaration(): Parser<FunctionDeclaration> {
  return map(
      seq(
          opt(seq(str('export'), spacesPlus)),
          functionReturnType,
          spacesPlus,
          functionName,
          wspacesOrComment,
          between(str('('), opt(parameters), str(')')),
          wspacesOrComment,
          scope()
      ),
      ([exported, type, , name, , params, , scope]) => ({kind: 'function', exported: !!exported, type, name, params: params ?? [], body: scope})
  );
}