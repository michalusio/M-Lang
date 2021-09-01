import { ASTStatement } from '../language/interfaces';
import { visit, visitTable } from '../visitor';
import { typeDeclarationCheckVisitor } from './type-declaration-check';
import { variableDeclarationCheckVisitor } from './variable-declaration-check';

export function check(root: ASTStatement): ASTStatement {
  root = visitTable(['object', 'let', 'function', 'parameter', 'property'], typeDeclarationCheckVisitor(), root, undefined);
  root = visit('function', variableDeclarationCheckVisitor, root, undefined);
  return root;
}