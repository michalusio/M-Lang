import { basicRuntimeTypes } from './basic-runtime-types';
import { Program } from './interfaces';

export const systemImport: Program = {
  kind: 'program',
  imports: [],
  nodes: [
    {
      kind: 'function',
      exported: true,
      name: 'log',
      params: [ { kind: 'parameter', name: 'message', type: basicRuntimeTypes[2] } ],
      type: basicRuntimeTypes[0],
      body: { kind: 'scope', lines: []}
    }
  ]
}