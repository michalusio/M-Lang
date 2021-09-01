import { ObjectDeclaration, Type } from './interfaces';

function withSize(type: string, sizes: number[]): string[] {
  return sizes.map(size => `${type}${size}`);
}

export const basicRuntimeTypeNames = [
  'void',
  'bool',
  'string',
  ...withSize('int', [8, 16, 32]),
  ...withSize('uint', [8, 16, 32])
];

export const basicRuntimeTypes: Type[] = basicRuntimeTypeNames.map(name => ({ kind: 'type', isArray: false, name}));

export const basicRuntimeDeclarations: ObjectDeclaration[] = basicRuntimeTypeNames.map(name => (<ObjectDeclaration>{kind: 'object', exported: true, name: name, properties: []}));

export const indexerTypes = [
  ...withSize('int', [8, 16, 32]),
  ...withSize('uint', [8, 16, 32])
];