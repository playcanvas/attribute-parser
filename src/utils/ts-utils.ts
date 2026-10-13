import { knownLibFilesForCompilerOptions } from '@typescript/vfs';
import * as ts from 'typescript';

import { ParsingError } from '../parsers/parsing-error.ts';

/**
 * A TS AST node with internal properties that are absent from the public type definitions.
 */
export type InternalNode = ts.Node & {
    jsDoc?: ts.JSDoc[];
    initializer?: ts.Expression;
    name?: ts.DeclarationName;
    type?: ts.TypeNode;
    members?: ts.NodeArray<ts.Node>;
    properties?: ts.NodeArray<ts.Node>;
    symbol?: ts.Symbol;
};

/**
 * A literal value extracted from an AST node.
 */
export type LiteralValue =
    string | number | boolean | null | undefined | ts.PseudoBigInt | LiteralValue[] | { [key: string]: LiteralValue };

export function createDefaultMapFromCDN(options: ts.CompilerOptions, prefix: string, tsLib: typeof ts) {
    const fsMap = new Map<string, string>();
    const files = knownLibFilesForCompilerOptions(options, tsLib);

    async function uncached() {
        const contentPromises = files.map((lib) => {
            return fetch(prefix + lib).then((resp) => {
                if (!resp.ok) {
                    throw new Error(`Failed to fetch ${prefix + lib}: ${resp.statusText}`);
                }
                return resp.text();
            });
        });

        const contents = await Promise.all(contentPromises);

        contents.forEach((text, index) => fsMap.set(`/${files[index]}`, text));

        return fsMap;
    }

    return uncached();
}

/**
 * Resolves the original symbol in case of alias.
 * @param typeChecker - The TypeScript type checker
 * @param symbol - The TypeScript symbol
 * @returns The resolved symbol
 */
function resolveAliasedSymbol(typeChecker: ts.TypeChecker, symbol: ts.Symbol) {
    while (symbol.flags & ts.SymbolFlags.Alias) {
        symbol = typeChecker.getAliasedSymbol(symbol);
    }
    return symbol;
}

/**
 * Returns a map of exported nodes from a TypeScript source file.
 * @param program - The TypeScript program
 * @param sourceFile - The TypeScript source file
 * @returns A Map of exported nodes
 */
export function getExportedNodes(program: ts.Program, sourceFile: ts.SourceFile) {
    // Find the actual declaration nodes for each exported symbol
    const exportedNodes = new Map<string, ts.Node>();

    if (!program || !sourceFile) {
        return exportedNodes;
    }

    const typeChecker = program.getTypeChecker();
    const moduleSymbol = typeChecker.getSymbolAtLocation(sourceFile);

    if (!moduleSymbol) {
        return exportedNodes;
    }

    const exportedSymbols = typeChecker.getExportsOfModule(moduleSymbol);

    exportedSymbols.forEach((symbol) => {
        const resolvedSymbol = resolveAliasedSymbol(typeChecker, symbol);
        if (resolvedSymbol.declarations) {
            const node = resolvedSymbol.declarations[0];
            const name = symbol.name === 'default' ? (node as InternalNode).name.getText() : symbol.name;
            exportedNodes.set(name, node);
        }
    });

    return exportedNodes;
}

/**
 * Checks if the node or its aliased symbol is a class declaration.
 *
 * @param node - The TypeScript node
 * @param typeChecker - The TypeScript type checker
 * @returns True if the node or its original declaration is a class declaration, false otherwise
 */
export function isAliasedClassDeclaration(node: ts.Node, typeChecker: ts.TypeChecker) {
    if (ts.isClassDeclaration(node)) {
        return true;
    }
    // Try to resolve the original declaration
    const name = (node as InternalNode).name;
    if (name && ts.isIdentifier(name)) {
        const symbol = typeChecker.getSymbolAtLocation(name);
        if (symbol) {
            const resolvedSymbol = resolveAliasedSymbol(typeChecker, symbol);
            if (resolvedSymbol.declarations) {
                return resolvedSymbol.declarations.some(ts.isClassDeclaration);
            }
        }
    }
    return false;
}

/**
 * Determines if a TypeScript node inherits from a specific base class.
 * @param node - The TypeScript node to analyze
 * @param typeChecker - The TypeScript type checker
 * @param baseClassSymbol - The base class symbol to check inheritance against
 * @returns True if the node inherits from the base class
 */
export function inheritsFrom(node: ts.ClassDeclaration, typeChecker: ts.TypeChecker, baseClassSymbol: ts.Symbol) {
    if (node.heritageClauses) {
        for (const clause of node.heritageClauses) {
            for (const type of clause.types) {
                // Get the symbol of the expression
                const symbol = typeChecker.getTypeAtLocation(type.expression).getSymbol();

                // Check if the symbol is the base class symbol
                if (symbol === baseClassSymbol) {
                    return true;
                }

                // Get the declaration of the symbol to check its heritage clauses
                if (symbol?.declarations.length > 0) {
                    const declaration = symbol.declarations[0];
                    if (inheritsFrom(declaration as ts.ClassDeclaration, typeChecker, baseClassSymbol)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

/**
 * Recursively gathers and flat maps and nodes that meet a specific filter.
 * @param node - The TypeScript node to analyze
 * @param filter - A function to filter the nodes
 * @returns An array of exported class declarations
 */
export function flatMapAnyNodes(node: ts.Node, filter: (node: ts.Node) => boolean = () => true) {
    const results: ts.Node[] = [];

    function visit(node: ts.Node) {
        // Check if this node is an exported class declaration
        if (filter(node)) {
            results.push(node);
        }

        // Visit each child node
        ts.forEachChild(node, visit);
    }

    // Start the search with the root node
    visit(node);

    return results;
}

/**
 * Takes a AST Node, and if it's a class declaration, it will return it's super classes
 *
 * @param node - The node to check
 * @param typeChecker - The programs typechecker
 * @returns The analyzed node and any super classes in the inheritance chain
 */
function getSuperClasses(node: ts.ClassDeclaration | ts.InterfaceDeclaration, typeChecker: ts.TypeChecker) {
    const superClasses = [node];

    let currentClass = node;

    while (currentClass) {
        const heritageClauses = currentClass.heritageClauses;
        if (!heritageClauses) {
            break;
        }

        const extendsClause = heritageClauses.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
        if (!extendsClause || extendsClause.types.length === 0) {
            break;
        }

        const superClassType = typeChecker.getTypeAtLocation(extendsClause.types[0]);
        const superClassSymbol = superClassType.getSymbol();

        if (!superClassSymbol) {
            break;
        }

        const superClassDeclaration = superClassSymbol.declarations.find(ts.isClassDeclaration);
        if (!superClassDeclaration) {
            break;
        }

        superClasses.push(superClassDeclaration);
        currentClass = superClassDeclaration;
    }

    return superClasses;
}

/**
 * Retrieves the JSDoc-style comments associated with a specific AST node.
 *
 * @param node - The TypeScript node to analyze
 * @param typeChecker - The TypeScript type checker
 * @returns An array of members with JSDoc comments
 */
export function getJSDocTags(node: ts.Node, typeChecker: ts.TypeChecker) {
    const tags: { memberName: string; member: ts.Node }[] = [];

    // check if class interface of initialized object
    if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
        // get an array of the class an all parent classed
        const heritageChain = getSuperClasses(node, typeChecker).filter(
            (classNode) => !classNode.getSourceFile().isDeclarationFile
        );

        // iterate over the heritance chain
        heritageChain.forEach((classNode) => {
            // for each class iterate over it's class members
            const classMembers: readonly ts.Node[] = classNode.members;
            classMembers.forEach((classMember) => {
                const isSetter = ts.isSetAccessor(classMember);
                if (ts.isPropertyDeclaration(classMember) || isSetter || ts.isPropertySignature(classMember)) {
                    const memberName =
                        classMember.name && ts.isIdentifier(classMember.name) ? classMember.name.text : 'unnamed';

                    let member: InternalNode = classMember;
                    let hasJsDoc = member.jsDoc?.length > 0;

                    // If we are a setter with no jsdoc block, check any associated getter
                    if (isSetter && !hasJsDoc) {
                        const symbol = typeChecker.getSymbolAtLocation(classMember.name);
                        member = symbol.declarations.find((accessor) => (accessor as InternalNode).jsDoc?.length > 0);
                        hasJsDoc = !!member;
                    }

                    if (hasJsDoc) {
                        tags.push({
                            memberName,
                            member
                        });
                    }
                }
            });
        });
    } else if (ts.isObjectLiteralExpression(node)) {
        // Handle object literals
        node.properties.forEach((property) => {
            if (ts.isPropertyAssignment(property)) {
                const memberName =
                    property.name && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
                        ? property.name.text
                        : 'unnamed';

                if ((property as InternalNode).jsDoc?.length > 0) {
                    tags.push({
                        memberName,
                        member: property
                    });
                }
            }
        });
    }

    return tags;
}

/**
 * Determines if a TypeScript node is an enum.
 * @param node - The TypeScript node to analyze
 * @returns True if the node is an enum
 */
export function isEnum(node: ts.Node) {
    // Check for TypeScript native enum
    if (ts.isEnumDeclaration(node)) {
        return true; // The node is a TypeScript enum
    }

    // Check for JSDoc @enum tag in a variable declaration
    if (ts.isVariableDeclaration(node)) {
        const jsDocs = ts.getJSDocTags(node);
        const hasEnumTag = jsDocs.some((doc) => doc.tagName.text === 'enum');
        return hasEnumTag;
    }

    return false;
}

/**
 * Determines the primitive type for enums, or falls back to the actual type name.
 *
 * @param type - The type to inspect.
 * @param typeChecker - The TypeScript type checker.
 * @returns The primitive type of the enum or null.
 */
export function getPrimitiveEnumType(type: ts.Type, typeChecker: ts.TypeChecker) {
    // Check if the type is an enum type
    const isEnumType = type.symbol?.declarations?.some((decl) => ts.isEnumDeclaration(decl));

    // If not directly an enum, check if it's an enum member (which means it's part of an enum)
    let isEnumMember = false;
    if (!isEnumType) {
        isEnumMember = type.symbol?.declarations?.some((decl) => ts.isEnumMember(decl));
        if (!isEnumMember) return null;
    }

    // Get the enum members
    let enumMembers;
    if (isEnumType) {
        enumMembers = (type.symbol.declarations[0] as ts.EnumDeclaration).members;
    } else if (isEnumMember) {
        const enumMember = type.symbol.declarations[0];
        const parentEnum = enumMember.parent;
        if (ts.isEnumDeclaration(parentEnum)) {
            enumMembers = parentEnum.members;
        } else {
            return null;
        }
    }

    // Get the value of the first enum member using our centralized logic
    const firstMember = enumMembers[0];
    const firstMemberValue = firstMember.initializer
        ? getLiteralValue(firstMember.initializer, typeChecker)
        : getLiteralValue(firstMember, typeChecker);

    const validEnumTypes = ['number', 'string', 'boolean'];
    const typeOf = typeof firstMemberValue;
    return validEnumTypes.includes(typeOf) ? typeOf : null;
}

/**
 * Gets the inferred type of a TypeScript node.
 *
 * @param node - The TypeScript node to analyze
 * @param typeChecker - The TypeScript type checker
 * @returns The inferred type of the node
 */
export function getType(node: ts.Node, typeChecker: ts.TypeChecker) {
    if ((node as InternalNode).name?.kind === ts.SyntaxKind.Identifier) {
        const type = typeChecker.getTypeAtLocation(node);
        const array = typeChecker.isArrayType(type);
        // getElementTypeOfArrayType is an internal TS API absent from the public types
        const checker = typeChecker as ts.TypeChecker & { getElementTypeOfArrayType(type: ts.Type): ts.Type };
        const actualType = array ? checker.getElementTypeOfArrayType(type) : type;

        // A type could be a literal union, such as '1 | 2 | 3', so we need to get the base type
        const baseType = typeChecker.getBaseTypeOfLiteralType(actualType);

        // If baseType has multiple types, it means we have a mixed union, ie 'a' | false | 1.
        let isMixedUnion = false;
        const unionTypes = (baseType as ts.UnionType).types;
        if (Array.isArray(unionTypes)) {
            const primitiveKinds = new Set(unionTypes.map((t) => typeChecker.getBaseTypeOfLiteralType(t)));
            primitiveKinds.delete(null);
            isMixedUnion = primitiveKinds.size > 1;
        }

        // Instantiations of generic classes (e.g. `Asset<string>`) are reported by their class name
        const ref = baseType as ts.TypeReference;
        const genericName = ref.target && ref.target !== ref ? baseType.symbol?.name : undefined;
        const name = getPrimitiveEnumType(baseType, typeChecker) ?? genericName ?? typeChecker.typeToString(baseType);

        return { type: baseType, name, array, isMixedUnion };
    }

    return null;
}

/**
 * Parses a numerical string into a number. Handles hexadecimal, binary,
 * octal, exponential notation and underscore notation
 *
 * @param input - The string to parse
 * @returns The parsed number, or NaN if the input is not a number
 */
export function parseNumber(input: string) {
    // Remove underscores from the string to handle underscore notation
    let cleanedInput = input.replace(/_/g, '').toLowerCase();

    // Identify and isolate unary operators
    let unaryOperator = null;
    if (cleanedInput.startsWith('+') || cleanedInput.startsWith('-') || cleanedInput.startsWith('~')) {
        unaryOperator = cleanedInput[0];
        cleanedInput = cleanedInput.slice(1).trim();
    }

    // Check for different bases and handle appropriately
    let result;
    if (cleanedInput === 'NaN' || cleanedInput === '') {
        result = NaN;
    } else if (cleanedInput.startsWith('0b')) {
        result = parseInt(cleanedInput.slice(2), 2);
    } else if (cleanedInput.startsWith('0o')) {
        result = parseInt(cleanedInput.slice(2), 8);
    } else if (cleanedInput.startsWith('0x')) {
        result = parseInt(cleanedInput.slice(2), 16);
    } else if (cleanedInput.includes('e')) {
        result = parseFloat(cleanedInput); // Exponential notation
    } else if (!isNaN(Number(cleanedInput))) {
        result = Number(cleanedInput); // Decimal, including floating-point
    } else {
        result = NaN;
    }

    // Apply unary operator if present
    if (unaryOperator === '+') {
        result = +result; // Positive sign can be ignored, but explicitly using for clarity
    } else if (unaryOperator === '-') {
        result = -result;
    } else if (unaryOperator === '~') {
        result = ~result; // Bitwise NOT
    }

    return result;
}

/**
 * Parses a string representation of a numerical array into an array of numbers.
 *
 * @param input - The string to parse
 * @returns The parsed array of numbers
 * @throws If the input contains invalid characters or is not a valid array
 */
export function parseStringToNumericalArray(input: string) {
    // Remove unnecessary whitespace
    const sanitizedInput = input.replace(/\s+/g, '');

    // Check if the input still contains valid array format
    if (!sanitizedInput.startsWith('[') || !sanitizedInput.endsWith(']')) {
        throw new Error('Invalid input string');
    }

    // Remove the brackets and split the string into an array
    const arrayString = sanitizedInput.slice(1, -1);
    const elements = arrayString.split(',');

    // Parse each element using the parseNumber function
    const parsedArray = elements.map((element) => {
        return parseNumber(element.trim());
    });

    // Validate if the result is an array and contains only valid numbers
    if (parsedArray.some(isNaN)) {
        throw new Error('Parsed result contains invalid numbers');
    }

    return parsedArray;
}

/**
 * Checks if the given node is a numerical literal or a unary expression.
 * @param node - The node to check
 * @returns True if the node is a numeric literal
 */
export const isNumericLiteral = (node: ts.Node) => {
    // Is the node a numeric literal '10'
    const isNumericLiteral = ts.isNumericLiteral(node);

    // Or is it a +/- unary expression '-10' or '+10'
    const isUnaryExpression =
        ts.isPrefixUnaryExpression(node) && //
        (node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.PlusToken) &&
        node.operand.kind === ts.SyntaxKind.NumericLiteral;

    return isNumericLiteral || isUnaryExpression;
};

/**
 * If the given node is a numeric literal, returns the parsed number.
 * @param node - The node to check
 * @param isArgument - True if the node is an argument in a parameter list
 * @returns The parsed number
 * @throws {ParsingError} If the node is not a numeric literal
 */
export const parseFloatNode = (node: ts.Node, isArgument = false) => {
    if (!isNumericLiteral(node)) {
        if (ts.isPropertyAssignment(node.parent) || ts.isPropertyDeclaration(node.parent) || isArgument) {
            throw new ParsingError(
                node,
                'Not a Literal',
                `"${node.parent.getText()}" must be defined with a numeric literal.`
            );
        }
        return 0;
    }
    return parseNumber(node.getText());
};

/**
 * If the given node is a boolean literal, returns the parsed boolean.
 * @param node - The node to check
 * @returns The parsed boolean
 */
export const parseBooleanNode = (node: ts.Node) => {
    if (node.kind !== ts.SyntaxKind.TrueKeyword && node.kind !== ts.SyntaxKind.FalseKeyword) {
        if (ts.isPropertyAssignment(node.parent) || ts.isPropertyDeclaration(node.parent)) {
            throw new ParsingError(
                node,
                'Not a Literal',
                `"${node.parent.getText()}" must be defined with a boolean literal.`
            );
        }
        return false;
    }
    return node.kind === ts.SyntaxKind.TrueKeyword;
};

function resolveIdentifier(node: ts.Node, typeChecker: ts.TypeChecker) {
    const symbol = typeChecker.getSymbolAtLocation(node);
    if (symbol && symbol.declarations) {
        for (const declaration of symbol.declarations) {
            if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
                return getLiteralValue(declaration.initializer, typeChecker);
            }
            // Handle other kinds of declarations if needed
        }
    }

    // Fallback to getLiteralValue which now handles typeChecker approach
    return undefined;
}

/**
 * Resolve the value of a property access expression. Limited to simple cases like
 * object literals and variable declarations.
 *
 * @param node - The property access expression node
 * @param typeChecker - The TypeScript type checker
 * @returns The resolved value of the property access
 */
const resolvePropertyAccess = (node: ts.PropertyAccessExpression, typeChecker: ts.TypeChecker) => {
    const symbol = typeChecker.getSymbolAtLocation(node);
    if (symbol && symbol.declarations) {
        for (const declaration of symbol.declarations) {
            if (ts.isPropertyAssignment(declaration) && declaration.initializer) {
                return getLiteralValue(declaration.initializer, typeChecker);
            }

            if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
                return getLiteralValue(declaration.initializer, typeChecker);
            }

            if (ts.isEnumMember(declaration)) {
                return declaration.initializer
                    ? getLiteralValue(declaration.initializer, typeChecker)
                    : declaration.name.getText();
            }
        }
    }

    // Try getLiteralValue first (which now handles typeChecker approach)
    const result = getLiteralValue(node, typeChecker);
    if (result !== undefined) {
        return result;
    }

    // If symbol not found directly, attempt to resolve the object first
    const objValue = getLiteralValue(node.expression, typeChecker);
    if (objValue && typeof objValue === 'object') {
        const propName = node.name.text;
        return (objValue as Record<string, LiteralValue>)[propName];
    }

    return undefined;
};

/**
 * Evaluates unary prefixes like +, -, !, ~, and returns the result.
 * @param node - The AST node to evaluate
 * @param typeChecker - The TypeScript type checker
 * @returns The result of the evaluation
 */
const evaluatePrefixUnaryExpression = (node: ts.PrefixUnaryExpression, typeChecker: ts.TypeChecker) => {
    const operandValue = getLiteralValue(node.operand, typeChecker);
    if (operandValue !== undefined) {
        switch (node.operator) {
            case ts.SyntaxKind.PlusToken:
                return +(operandValue as number);
            case ts.SyntaxKind.MinusToken:
                return -(operandValue as number);
            case ts.SyntaxKind.ExclamationToken:
                return !operandValue;
            case ts.SyntaxKind.TildeToken:
                return ~(operandValue as number);
        }
    }
    return undefined;
};

function handleObjectLiteral(node: ts.ObjectLiteralExpression, typeChecker: ts.TypeChecker) {
    const obj: Record<string, LiteralValue> = {};
    node.properties.forEach((prop) => {
        if (ts.isPropertyAssignment(prop)) {
            const key = prop.name.getText();
            const value = getLiteralValue(prop.initializer, typeChecker);
            obj[key] = value;
        } else if (ts.isShorthandPropertyAssignment(prop)) {
            const key = prop.name.getText();
            const value = resolveIdentifier(prop.name, typeChecker);
            obj[key] = value;
        }
    });
    return obj;
}

/**
 * Attempts to extract a literal value from a TypeScript node. This function
 * supports various types of literals and expressions, including object literals,
 * array literals, identifiers, and unary expressions.
 *
 * @param node - The AST node to evaluate
 * @param typeChecker - The TypeScript type checker
 * @returns The extracted literal value
 */
export function getLiteralValue(node: ts.Node, typeChecker?: ts.TypeChecker): LiteralValue {
    if (!node) return undefined;

    // Try typeChecker approach first for imported constants and other complex cases
    if (typeChecker) {
        const type = typeChecker.getTypeAtLocation(node);
        if (type && type.isLiteral()) {
            return type.value;
        }
    }

    const isBooleanLiteral = node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword;
    if (ts.isLiteralExpression(node) || isBooleanLiteral) {
        if (ts.isStringLiteral(node)) {
            return node.text;
        }
        if (ts.isNumericLiteral(node)) {
            return Number(node.text);
        }
        if (node.kind === ts.SyntaxKind.TrueKeyword) {
            return true;
        }
        if (node.kind === ts.SyntaxKind.FalseKeyword) {
            return false;
        }
    }

    switch (node.kind) {
        case ts.SyntaxKind.NullKeyword:
            return null;
        case ts.SyntaxKind.ArrayLiteralExpression:
            return (node as ts.ArrayLiteralExpression).elements.map((element) => getLiteralValue(element, typeChecker));
        case ts.SyntaxKind.ObjectLiteralExpression:
            return handleObjectLiteral(node as ts.ObjectLiteralExpression, typeChecker);
        case ts.SyntaxKind.Identifier:
            return resolveIdentifier(node, typeChecker);
        case ts.SyntaxKind.PropertyAccessExpression:
            return resolvePropertyAccess(node as ts.PropertyAccessExpression, typeChecker);
        case ts.SyntaxKind.ParenthesizedExpression:
            return getLiteralValue((node as ts.ParenthesizedExpression).expression, typeChecker);
        case ts.SyntaxKind.PrefixUnaryExpression:
            return evaluatePrefixUnaryExpression(node as ts.PrefixUnaryExpression, typeChecker);
        default:
            return undefined;
    }
}

/**
 * If the given node is a string literal, returns the parsed string.
 * @param node - The node to check
 * @returns The parsed string
 */
export const parseStringNode = (node: ts.Node) => {
    if (node.kind !== ts.SyntaxKind.StringLiteral) {
        if (ts.isPropertyAssignment(node.parent) || ts.isPropertyDeclaration(node.parent)) {
            throw new ParsingError(
                node,
                'Not a Literal',
                `"${node.parent.getText()}" must be defined with a string literal.`
            );
        }
        return '';
    }
    return node.getText().slice(1, -1);
};

export const parseArrayLiteralNode = (node: ts.Node, isArgument = false) => {
    if (node.kind !== ts.SyntaxKind.ArrayLiteralExpression) {
        if (ts.isPropertyAssignment(node.parent) || ts.isPropertyDeclaration(node.parent) || isArgument) {
            throw new ParsingError(
                node,
                'Not a Literal',
                `"${node.parent.getText()}" must be defined with an array literal.`
            );
        }
        return [];
    }
    return JSON.parse(node.getText());
};

/**
 * Parses the first argument as an array literal.
 * @param args - The arguments to parse
 * @returns The parsed array
 */
export const parseArrayLiteral = (args: readonly ts.Node[]) => {
    if (args.length > 0) {
        return parseArrayLiteralNode(args[0], true);
    }
    return [];
};
