import { basicRuntimeTypeNames } from '../language/basic-runtime-types';
import {
  ASTStatement,
  FunctionDeclaration,
  LetStatement,
  ObjectDeclaration,
  Parameter,
  Property,
} from '../language/interfaces';

export function typeDeclarationCheckVisitor(): (node: ObjectDeclaration | LetStatement | FunctionDeclaration | Parameter | Property) => ASTStatement {
  const declaredTypes: string[] = [...basicRuntimeTypeNames];
  return (node: ObjectDeclaration | LetStatement | FunctionDeclaration | Parameter | Property): ASTStatement => {
      if (node.kind === 'object') {
        declaredTypes.push(node.name);
      }
      else if (!declaredTypes.includes(node.type.name)) throw new Error(`Type ${node.type.name} is not declared`);

      return node;
    }
}