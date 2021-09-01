import { ParseFile } from 'parser-combinators';
import { any, exhaust, expect, many, map, seq, str, wspaces } from 'parser-combinators/parsers';
import { Context, Parser, Result } from 'parser-combinators/types';
import { dirname, join } from 'path';

import { wspacesOrComment } from './core';
import { functionDeclaration } from './function-declaration';
import { Declaration, ImportDeclaration, Program } from './interfaces';
import { objectDeclaration } from './object-declarations';
import { stringStatement } from './statements/statements';
import { systemImport } from './system-calls';

const declaration = (): Parser<Declaration> => any(
  expect(objectDeclaration(), 'object declaration'),
  expect(functionDeclaration(), 'function declaration')
  );

function importDeclaration(): Parser<ImportDeclaration> {
  return (ctx: Context): Result<ImportDeclaration> => {
    const res = map(
      seq(str('import'), wspaces, stringStatement, str(';'), wspacesOrComment),
      ([,, path]) => ({ kind: 'import', path: path.value, node: {} as Program })
    )(ctx);
    if (!res.success) return res;
    let res2 = getFromCache(res.value.path);
    if (!res2) {
      console.log(`Parsing ${res.value.path}`);
      res2 = ParseFile(join(dirname(ctx.path), res.value.path), program());
    }
    else {
      console.log(`File ${res.value.path} found in cache`);
    }
    setToCache(res.value.path, res2);
    return { ...res, value: { ...res.value, kind: 'import', node: res2 } };
  }
}

const parseCache: Map<string, Program> = new Map([['system', systemImport]]);

export function clearParseCache(): void {
    parseCache.clear();
    parseCache.set('system', systemImport);
}

function getFromCache(path: string): Program | undefined {
    return parseCache.get(path);
}

function setToCache(path: string, program: Program): void {
    parseCache.set(path, program);
}

export function program(): Parser<Program> {
  return map(
    seq(
      wspacesOrComment,
      many(importDeclaration()),
      exhaust(map(seq(wspacesOrComment, declaration(), wspacesOrComment), ([, dec,])=> dec)),
    ),
    ([, imports, decs]) => ({ kind: 'program', imports, nodes: decs })
  );
}