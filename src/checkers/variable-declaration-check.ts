import { basicRuntimeTypes, indexerTypes } from '../language/basic-runtime-types';
import {
  ASTStatement,
  Declaration,
  FunctionDeclaration,
  LStatement,
  MethodCallStatement,
  ObjectDeclaration,
  Program,
  PropertyStatement,
  RStatement,
  Scope,
  Statement,
  Type,
} from '../language/interfaces';

type StatementProblem =
  { type: 'duplicate', name: string }
| { type: 'missing', name: string }
| { type: 'typeMismatch', statement: ASTStatement, type1: Type | undefined, type2: Type | undefined }
| { type: 'typeNotIndexable', statement: LStatement }
| { type: 'typeNotIndexer', statement: RStatement }
| { type: 'notAMethod', statement: LStatement }
| { type: 'propertyMissingFromObject', statement: PropertyStatement }
| { type: 'objectTypeMissing', statement: LStatement }
| { type: 'tooManyArguments', statement: MethodCallStatement }
| { type: 'ifNeedsBool', statement: RStatement }
| null;

type FunctionType = Type & {
  params: Type[];
};

type ObjectType = Type & {
  props: Map<string, Type>;
}

export function variableDeclarationCheckVisitor(node: FunctionDeclaration, parent: ASTStatement | undefined): ASTStatement {
  const types = getTypesFromProgram(parent as Program);
  const variables: string[] = [];
  types.forEach((value, key) => {
    if ((value as FunctionType).params) {
      variables.push(key);
    }
  });
  node.params.forEach(param => {
    variables.push(param.name);
    types.set(param.name, param.type);
    decorateWithTypes(param, param.type);
  });
  const result = checkScope(node.body, variables, types);
  if (result) {
    switch (result.type) {
      case 'duplicate':
        throw new Error(`Variable ${result.name} is declared twice`);
      case 'missing':
        throw new Error(`Variable ${result.name} is not declared`);
      case 'typeMismatch':
        throw new Error(`Type mismatch on: ${stringifyStatement(result.statement)} between ${result.type1?.name + (result.type1?.isArray ? '[]' : '')} and ${result.type2?.name + (result.type2?.isArray ? '[]' : '')}`);
      case 'typeNotIndexable':
        throw new Error(`Type not indexable on: ${stringifyStatement(result.statement)}`);
      case 'typeNotIndexer':
        throw new Error(`Type not an indexer on: ${stringifyStatement(result.statement)}`);
      case 'notAMethod':
        throw new Error(`Type not a method on: ${stringifyStatement(result.statement)}`);
      case 'objectTypeMissing':
        throw new Error(`Property missing type declaration on: ${stringifyStatement(result.statement)}`);
      case 'propertyMissingFromObject':
        throw new Error(`Property missing from object on: ${stringifyStatement(result.statement)}`);
      case 'tooManyArguments':
        throw new Error(`Too many arguments in function call on: ${stringifyStatement(result.statement)}`);
      case 'ifNeedsBool':
        throw new Error(`If statement needs a bool on: ${stringifyStatement(result.statement)}`);
    }
  }
  return node;
}

function checkScope(node: Scope, declaredVariables: string[], variableTypes: Map<string, Type>): StatementProblem {
  for (const line of node.lines) {
    const result = checkStatement(line, declaredVariables, variableTypes);
    if (result) {
      return result;
    }
  }
  return null;
}

function checkStatement(line: Statement, declaredVariables: string[], variableTypes: Map<string, Type>): StatementProblem {
  switch (line.kind) {
    case 'let':
      if (declaredVariables.includes(line.name)) { return { type: 'duplicate', name: line.name }; }
      if (line.assignment) {
        const rStatementResult = checkRStatement(line.assignment, declaredVariables, variableTypes);
        if (rStatementResult) return rStatementResult;
        const typeResult: StatementProblem = typesEqual(variableTypes.get(stringifyStatement(line.assignment)), line.type)
          ? null
          : { type: 'typeMismatch', statement: line, type1: line.type, type2: variableTypes.get(stringifyStatement(line.assignment)) };
        if (typeResult) return typeResult;
      }
      declaredVariables.push(line.name);
      variableTypes.set(line.name, line.type);
      decorateWithTypes(line, line.type);
      return null;

    case 'assignment':
      const rStatementResult = checkRStatement(line.value, declaredVariables, variableTypes);
      if (rStatementResult) return rStatementResult;
      const lStatementResult = checkLStatement(line.to, declaredVariables, variableTypes);
      if (lStatementResult) return lStatementResult;
      const typeResult: StatementProblem = typesEqual(variableTypes.get(stringifyStatement(line.to)), variableTypes.get(stringifyStatement(line.value)))
        ? null
        : { type: 'typeMismatch', statement: line, type1: variableTypes.get(stringifyStatement(line.to)), type2: variableTypes.get(stringifyStatement(line.value))};
      return typeResult;

    case 'if':
      const result = checkRStatement(line.condition, declaredVariables, variableTypes) || checkStatement(line.then, [...declaredVariables], new Map(variableTypes)) || (line.elseThen ? checkStatement(line.elseThen, [...declaredVariables], new Map(variableTypes)) : null);
      if (result) return result;
      const conditionType = variableTypes.get(stringifyStatement(line.condition)) as Type;
      if (!conditionType || conditionType.name !== basicRuntimeTypes[1].name || conditionType.isArray) 
        return { type: 'ifNeedsBool', statement: line.condition };
      return null;

    case 'methodCall':
      return checkMethodCall(line, declaredVariables, variableTypes);

    case 'scope':
      return checkScope(line, [...declaredVariables], new Map(variableTypes));
  }
}

function checkRStatement(statement: RStatement, declaredVariables: string[], variableTypes: Map<string, Type>): StatementProblem {
  switch (statement.kind) {
    case 'methodCall':
      return checkMethodCall(statement, declaredVariables, variableTypes);

    case 'arithmetic':
      const result = checkRStatement(statement.left, declaredVariables, variableTypes) || checkRStatement(statement.right, declaredVariables, variableTypes);
      if (result) return result;

      const leftType = variableTypes.get(stringifyStatement(statement.left));
      const rightType = variableTypes.get(stringifyStatement(statement.right));

      const typeResult: StatementProblem = typesEqual(leftType, rightType)
        ? null
        : { type: 'typeMismatch', statement, type1: leftType, type2: rightType };
      if (typeResult) return typeResult;

      const resultantType = statement.operator === '+' || statement.operator === '-' || statement.operator === '*' || statement.operator === '/'
        ? leftType
        : basicRuntimeTypes[1];

      variableTypes.set(stringifyStatement(statement), resultantType as Type);
      decorateWithTypes(statement, resultantType as Type);
      return null

    case 'variable':
    case 'indexing':
    case 'propertyAccess':
      return checkLStatement(statement, declaredVariables, variableTypes);
    
    case 'stringValue':
      variableTypes.set(stringifyStatement(statement), basicRuntimeTypes[2]);
      decorateWithTypes(statement, basicRuntimeTypes[2]);
      return null;

    case 'intValue':
      variableTypes.set(stringifyStatement(statement), basicRuntimeTypes[5]);
      decorateWithTypes(statement, basicRuntimeTypes[5]);
      return null;

    case 'boolValue':
      variableTypes.set(stringifyStatement(statement), basicRuntimeTypes[1]);
      decorateWithTypes(statement, basicRuntimeTypes[1]);
      return null;

    case 'realValue':
      variableTypes.set(stringifyStatement(statement), { kind: 'type', isArray: false, name: 'real64' });
      decorateWithTypes(statement, { kind: 'type', isArray: false, name: 'real64' });
      return null;
  }
}

function checkLStatement(statement: LStatement, declaredVariables: string[], variableTypes: Map<string, Type>): StatementProblem {
  switch(statement.kind) {
    case 'variable':
    {
      if (!declaredVariables.includes(statement.name)) { return { type: 'missing', name: statement.name }; }
      return null;
    }

    case 'indexing':
    {
      const result = checkLStatement(statement.from, declaredVariables, variableTypes) || checkRStatement(statement.index, declaredVariables, variableTypes);
      if (result) return result;

      const varType = variableTypes.get(stringifyStatement(statement.from)) as Type;
      if (!varType.isArray) return { type: 'typeNotIndexable', statement: statement.from };

      const indexType = variableTypes.get(stringifyStatement(statement.index)) as Type;
      if (indexType.isArray || !indexerTypes.includes(indexType.name)) return { type: 'typeNotIndexer', statement: statement.index };
      
      variableTypes.set(stringifyStatement(statement), { kind: 'type', name: varType.name, isArray: false });
      decorateWithTypes(statement, { kind: 'type', name: varType.name, isArray: false });
      return null;
    }

    case 'propertyAccess':
    {
      const result = (statement.from.kind === 'methodCall' ? checkMethodCall(statement.from, declaredVariables, variableTypes) : checkLStatement(statement.from, declaredVariables, variableTypes));
      if (result) return result;
      
      const fromType = variableTypes.get(stringifyStatement(statement.from)) as Type;
      if (fromType.isArray) return <StatementProblem>{ type: 'typeNotIndexable', statement: statement.from };

      const fromTypeDeclaration = variableTypes.get(fromType.name) as ObjectType;
      if (!fromTypeDeclaration || !fromTypeDeclaration.props) return <StatementProblem>{ type: 'objectTypeMissing', statement: statement };

      if (!fromTypeDeclaration.props.has(statement.to.name)) return <StatementProblem>{ type: 'propertyMissingFromObject', statement };
      variableTypes.set(stringifyStatement(statement), fromTypeDeclaration.props.get(statement.to.name) as Type);
      decorateWithTypes(statement, fromTypeDeclaration.props.get(statement.to.name) as Type);
      return null;
    }
  }
}

function checkMethodCall(line: MethodCallStatement, declaredVariables: string[], variableTypes: Map<string, Type>): StatementProblem {
  const fromResult = checkLStatement(line.from, declaredVariables, variableTypes);
  if (fromResult) return fromResult;

  const methodType = variableTypes.get(stringifyStatement(line.from)) as FunctionType;
  if (!methodType.params) return { type: 'notAMethod', statement: line.from };

  for(const argIndex in line.args) {
    const arg = line.args[argIndex];
    const argResult = checkRStatement(arg, declaredVariables, variableTypes);
    if (argResult) return argResult;
    
    const argType = variableTypes.get(stringifyStatement(arg)) as Type;
    const methodArgType = methodType.params[argIndex];
    if (!methodArgType) return { type: 'tooManyArguments', statement: line };
    if (!typesEqual(argType, methodArgType)) return { type: 'typeMismatch', statement: line, type1: methodArgType, type2: argType };
  }
  variableTypes.set(stringifyStatement(line), methodType);
  decorateWithTypes(line, methodType);
  return null;
}

function stringifyStatement(statement: ASTStatement): string {
  switch (statement.kind) {
    case 'variable':
      return statement.name;

    case 'indexing':
      return `${stringifyStatement(statement.from)}[${stringifyStatement(statement.index)}]`;

    case 'propertyAccess':
      return `${stringifyStatement(statement.from)}.${stringifyStatement(statement.to)}`;
    
    case 'arithmetic':
      return `(${stringifyStatement(statement.left)} ${statement.operator} ${stringifyStatement(statement.right)})`;
    
    case 'boolValue':
      return statement.value ? 'true' : 'false';
    
    case 'realValue':
    case 'intValue':
      return statement.value.toString();

    case 'stringValue':
      return `"${statement.value}"`;

    case 'methodCall':
      return `${stringifyStatement(statement.from)}(${statement.args.map(stringifyStatement).join(', ')})`;

    case 'assignment':
      return `${stringifyStatement(statement.to)} = ${stringifyStatement(statement.value)}`;

    case 'let':
      return `${stringifyStatement(statement.type)} ${statement.name}${statement.assignment ? ` = ${stringifyStatement(statement.assignment)}` : ''}`;

    case 'type':
      return `${statement.name}${statement.isArray? '[]' : ''}`;

    case 'function':
    case 'object':
    case 'parameter':
    case 'property':
    case 'program':
      return 'NOT IMPLEMENTED YET';

    case 'scope':
      return `{\n${statement.lines.join('\n')}\n}`;

    case 'if':
      return `if (${stringifyStatement(statement.condition)})\nthen ${stringifyStatement(statement.then)}${statement.elseThen ? `\nelse ${stringifyStatement(statement.elseThen)}`: ''}`;

    case 'import':
      return `import "${statement.path}"`;
  }
}

function decorateWithTypes(st: ASTStatement, type: Type): void {
  (st as { type: Type }).type = type;
}

function typesEqual(t1: Type | undefined, t2: Type | undefined): boolean {
  if (t1 && t2) {
    return t1.name === t2.name && t1.isArray === t2.isArray;
  }
  return false;
}

function getTypesFromProgram(pr: Program): Map<string, Type> {
  const types: Map<string, Type> = new Map();
  pr.imports.forEach(imp => getNodeTypes(imp.node.nodes.filter(n => n.exported)).forEach((value, key) => types.set(key, value)));
  getNodeTypes(pr.nodes).forEach((value, key) => types.set(key, value));
  return types;
}

function getNodeTypes(nodes: Declaration[]): Map<string, Type> {
  const types: Map<string, Type> = new Map();
  nodes.filter(n => n.kind === 'function').forEach(func => {
    const fn = func as FunctionDeclaration;
    const funcType: FunctionType = { ...fn.type, params: fn.params.map(p => p.type) };
    types.set(func.name, funcType);
  });
  nodes.filter(n => n.kind === 'object').forEach(obj => {
    const o = obj as ObjectDeclaration;
    const objType: ObjectType = { kind: 'type', name: o.name, isArray: false, props: new Map(o.properties.map(p => ([p.name, p.type]))) };
    types.set(o.name, objType);
  });
  return types;
}