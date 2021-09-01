import { between, map, oneOrMany, opt, seq, spacesPlus, str } from 'parser-combinators/parsers';
import { Parser } from 'parser-combinators/types';

import { objectName, parameterName, parameterType, wspacesOrComment } from './core';
import { ObjectDeclaration, Property } from './interfaces';

function property(): Parser<Property> {
  return map(
    seq(
      wspacesOrComment,
      parameterType,
      wspacesOrComment,
      parameterName,
      wspacesOrComment,
      str(';')
    ),
    ([, type, , name, ]) => ({kind: 'property', name, type})
  );
}

function properties(): Parser<Property[]> {
  return map(opt(oneOrMany(property(), wspacesOrComment)), (props) => (props ?? []));
}

export function objectDeclaration(): Parser<ObjectDeclaration> {
  return map(
      seq(
        opt(seq(str('export'), spacesPlus)),
        str('type'),
        spacesPlus,
        objectName,
        between(seq(wspacesOrComment, str('{')), properties(), seq(wspacesOrComment, str('}')))
      ),
      ([exported, , , name, params]) => ({kind: 'object', exported: !!exported, name, properties: params})
  );
}
