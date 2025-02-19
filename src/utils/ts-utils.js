import { knownLibFilesForCompilerOptions } from '@typescript/vfs';
import * as ts from 'typescript';

import { ParsingError } from '../parsers/parsing-error.js';

export function createDefaultMapFromCDN(options, prefix, ts) {
    const fsMap = new Map();
    const files = knownLibFilesForCompilerOptions(options, ts);

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
 * @param {import('typescript').TypeChecker} typeChecker - The TypeScript type checker
 * @param {import('typescript').Symbol} symbol - The TypeScript symbol
 * @returns {import('typescript').Symbol} - The resolved symbol
 */
function resolveAliasedSymbol(typeChecker, symbol) {
    while (symbol.flags & ts.SymbolFlags.Alias) {
        symbol = typeChecker.getAliasedSymbol(symbol);
    }
    return symbol;
}

/**
 * Returns an array of exported nodes from a TypeScript source file.
 * @param {import('typescript').Program} program - The TypeScript program
 * @param {import('typescript').SourceFile} sourceFile - The TypeScript source file
 * @returns {let map: Map<string, Set<import('typescript').Node>>} - A Map of exported nodes
 */
export function getExportedNodes(program, sourceFile) {
    if (!program || !sourceFile) {
        return [];
    }

    const typeChecker = program.getTypeChecker();
    const moduleSymbol = typeChecker.getSymbolAtLocation(sourceFile);

    if (!moduleSymbol) {
        return [];
    }

    const exportedSymbols = typeChecker.getExportsOfModule(moduleSymbol);

    // Find the actual declaration nodes for each exported symbol
    const exportedNodes = new Map();

    exportedSymbols.forEach((symbol) => {
        const resolvedSymbol = resolveAliasedSymbol(typeChecker, symbol);
        if (resolvedSymbol.declarations) {
            const node = resolvedSymbol.declarations[0];
            const name = symbol.name === 'default' ? node.name.getText() : symbol.name;
            exportedNodes.set(name, node);
        }
    });

    return exportedNodes;
}

/**
 * Checks if the node or its aliased symbol is a class declaration.
 *
 * @param {import('typescript').Node} node - The TypeScript node
 * @param {import('typescript').TypeChecker} typeChecker - The TypeScript type checker
 * @returns {boolean} - True if the node or its original declaration is a class declaration, false otherwise
 */
export function isAliasedClassDeclaration(node, typeChecker) {
    if (ts.isClassDeclaration(node)) {
        return true;
    }
    // Try to resolve the original declaration
    if (node?.name && ts.isIdentifier(node.name)) {
        const symbol = typeChecker.getSymbolAtLocation(node.name);
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
 * @param {ts.ClassDeclaration} node - The TypeScript node to analyze
 * @param {ts.TypeChecker} typeChecker - The TypeScript type checker
 * @param {ts.Symbol} baseClassSymbol - The base class symbol to check inheritance against
 * @returns {boolean} - True if the node inherits from the base class
 */
export function inheritsFrom(node, typeChecker, baseClassSymbol) {
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
                    if (inheritsFrom(declaration, typeChecker, baseClassSymbol)) {
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
 * @param {import('typescript').Node} node - The TypeScript node to analyze
 * @param {function} filter - A function to filter the nodes
 * @returns {import('typescript').Node[]} - An array of exported class declarations
 */
export function flatMapAnyNodes(node, filter = () => true) {
    const results = [];

    function visit(node) {
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
 * @param {import('typescript').Node} node - The node to check
 * @param {import('typescript').TypeChecker} typeChecker - The programs typechecker
 * @returns {import('typescript').Node[]} - The analyzed node and any super classes in the inheritance chain
 */
function getSuperClasses(node, typeChecker) {
    const superClasses = [node];

    let currentClass = node;

    while (currentClass) {
        const heritageClauses = currentClass.heritageClauses;
        if (!heritageClauses) {
            break;
        }

        const extendsClause = heritageClauses.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword);
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

    return superClasses; // .reverse(); // To return the array in order from the base class to the top-level class
}

/**
 * Retrieves the JSDoc-style comments associated with a specific AST node.
 *
 * @param {import('typescript').Node} node - The TypeScript node to analyze
 * @param {string} text - The full text content of the source file
 * @param {import('typescript').TypeChecker} typeChecker - The TypeScript type checker
 * @returns {{ memberName: string, member: Node, range: import('typescript').CommentRange}[]} - An array of comment ranges
 */
export function getJSDocTags(node, typeChecker) {
    const tags = [];

    if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
        // get an array of the class an all parent classed
        const heritageChain = getSuperClasses(node, typeChecker)
        .filter(classNode => !classNode.getSourceFile().isDeclarationFile);

        // iterate over the heritance chain
        heritageChain.forEach((classNode) => {
            // for each class iterate over it's class members
            classNode.members.forEach((member) => {
                const isSetter = ts.isSetAccessor(member);
                if (ts.isPropertyDeclaration(member) || isSetter || ts.isPropertySignature(member)) {
                    const memberName = member.name && ts.isIdentifier(member.name) ? member.name.text : 'unnamed';

                    let hasJsDoc = member.jsDoc?.length > 0;

                    // If we are a setter with no jsdoc block, check any associated getter
                    if (isSetter && !hasJsDoc) {
                        const symbol = typeChecker.getSymbolAtLocation(member.name);
                        member = symbol.declarations.find(accessor => accessor.jsDoc?.length > 0);
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
    }

    return tags;
}

/**
 * Determines if a TypeScript node is an enum.
 * @param {import('typescript').Node} node - The TypeScript node to analyze
 * @returns {boolean} - True if the node is an enum
 */
export function isEnum(node) {
    // Check for TypeScript native enum
    if (ts.isEnumDeclaration(node)) {
        return true; // The node is a TypeScript enum
    }

    // Check for JSDoc @enum tag in a variable declaration
    if (ts.isVariableDeclaration(node)) {
        const jsDocs = ts.getJSDocTags(node);
        const hasEnumTag = jsDocs.some(doc => doc.tagName.text === 'enum');
        return hasEnumTag;
    }

    return false;
}

/**
 * Determines the primitive type for enums, or falls back to the actual type name.
 *
 * @param {ts.Type} type - The type to inspect.
 * @param {ts.TypeChecker} typeChecker - The TypeScript type checker.
 * @returns {'string' | 'boolean' | 'number' | null} - The primitive type of the enum or the type's name.
 */
export function getPrimitiveEnumType(type, typeChecker) {
    // Check if the type is an enum type
    if (!type.symbol?.declarations?.some(decl => ts.isEnumDeclaration(decl))) return null;

    // Get the type of enum members
    const enumMembers = type.symbol.declarations[0].members;
    const firstMemberValue = typeChecker.getConstantValue(enumMembers[0]);

    const validEnumType = [
        'number',
        'string',
        'boolean'
    ];

    const typeOf = typeof firstMemberValue;
    return validEnumType.includes(typeOf) ? typeOf : null;
}

/**
 * Gets the inferred type of a TypeScript node.
 *
 * @param {ts.Node} node - The TypeScript node to analyze
 * @param {ts.TypeChecker} typeChecker - The TypeScript type checker
 * @returns {{ array: boolean, name: string | undefined, type: Type | null }} - The inferred type of the node
 */
export function getType(node, typeChecker) {
    if (node?.name?.kind === ts.SyntaxKind.Identifier) {
        const type = typeChecker.getTypeAtLocation(node);
        const array = typeChecker.isArrayType(type);
        const actualType = array ? typeChecker.getElementTypeOfArrayType(type) : type;
        const name = getPrimitiveEnumType(actualType, typeChecker) ?? typeChecker.typeToString(actualType);

        return { type: actualType, name, array };
    }

    return null;
}

/**
 * Parses a numerical string into a number. Handles hexadecimal, binary,
 * octal, exponential notation and underscore notation
 *
 * @param {string} input - The string to parse
 * @returns {number} The parsed number, or NaN if the input is not a number
 */
export function parseNumber(input) {
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
 * @param {string} input - The string to parse
 * @returns {number[]} - The parsed array of numbers
 * @throws {Error} - If the input contains invalid characters or is not a valid array
 */
export function parseStringToNumericalArray(input) {
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
 * @param {import('typescript').Node} node - The node to check
 * @returns {boolean} - True if the node is a numeric literal
 */
export const isNumericLiteral = (node) => {
    // Is the node a numeric literal '10'
    const isNumericLiteral = ts.isNumericLiteral(node);

    // Or is it a +/- unary expression '-10' or '+10'
    const isUnaryExpression =
        ts.isUnaryExpression(node) && //
        (node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.PlusToken) &&
        node.operand.kind === ts.SyntaxKind.NumericLiteral;

    return isNumericLiteral || isUnaryExpression;
};

/**
 * If the given node is a numeric literal, returns the parsed number.
 * @param {import('typescript').Node} node - The node to check
 * @param {boolean} [isArgument] - True if the node is an argument in a parameter list
 * @returns {number} - The parsed number
 * @throws {ParsingError} - If the node is not a numeric literal
 */
export const parseFloatNode = (node, isArgument = false) => {
    if (!isNumericLiteral(node)) {
        if (ts.isPropertyAssignment(node.parent) || ts.isPropertyDeclaration(node.parent) || isArgument) {
            throw new ParsingError(node, `"${node.parent.getText()}" must be defined with a numeric literal.`);
        }
        return 0;
    }
    return parseNumber(node.getText());
};

/**
 * If the given node is a boolean literal, returns the parsed boolean.
 * @param {import('typescript').Node} node - The node to check
 * @returns {boolean} - The parsed boolean
 */
export const parseBooleanNode = (node) => {
    if (node.kind !== ts.SyntaxKind.TrueKeyword && node.kind !== ts.SyntaxKind.FalseKeyword) {
        if (ts.isPropertyAssignment(node.parent) || ts.isPropertyDeclaration(node.parent)) {
            throw new ParsingError(node, `"${node.parent.getText()}" must be defined with a boolean literal.`);
        }
        return false;
    }
    return node.kind === ts.SyntaxKind.TrueKeyword;
};

function resolveIdentifier(node, typeChecker) {
    const symbol = typeChecker.getSymbolAtLocation(node);
    if (symbol && symbol.declarations) {
        for (const declaration of symbol.declarations) {
            if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
                return getLiteralValue(declaration.initializer, typeChecker);
            }
            // Handle other kinds of declarations if needed
        }
    }
    return undefined;
}

/**
 * Resolve the value of a property access expression. Limited to simple cases like
 * object literals and variable declarations.
 *
 * @param {import('typescript').Node} node - The property access expression node
 * @param {import('typescript')} typeChecker - The TypeScript type checker
 * @returns {any} - The resolved value of the property access
 */
const resolvePropertyAccess = (node, typeChecker) => {
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
                return declaration.initializer ? getLiteralValue(declaration.initializer, typeChecker) : declaration.name.getText();
            }

        }
    }

    // If symbol not found directly, attempt to resolve the object first
    const objValue = getLiteralValue(node.expression, typeChecker);
    if (objValue && typeof objValue === 'object') {
        const propName = node.name.text;
        return objValue[propName];
    }

    return undefined;
};

/**
 * Evaluates unary prefixes like +, -, !, ~, and returns the result.
 * @param {import('typescript').Node} node - The AST node to evaluate
 * @param {import('typescript').TypeChecker} typeChecker - The TypeScript type checker
 * @returns {number | boolean | undefined} - The result of the evaluation
 */
const evaluatePrefixUnaryExpression = (node, typeChecker) => {
    const operandValue = getLiteralValue(node.operand, typeChecker);
    if (operandValue !== undefined) {
        switch (node.operator) {
            case ts.SyntaxKind.PlusToken:
                return +operandValue;
            case ts.SyntaxKind.MinusToken:
                return -operandValue;
            case ts.SyntaxKind.ExclamationToken:
                return !operandValue;
            case ts.SyntaxKind.TildeToken:
                return ~operandValue;
        }
    }
    return undefined;
};

function handleObjectLiteral(node, typeChecker) {
    const obj = {};
    node.properties.forEach((prop) => {
        if  (ts.isPropertyAssignment(prop)) {
            const key = prop.name.getText();
            const value = getLiteralValue(prop.initializer, typeChecker);
            obj[key] = value;
        } else if  (ts.isShorthandPropertyAssignment(prop)) {
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
 * @param {import('typescript').Node} node - The AST node to evaluate
 * @param {import('typescript').TypeChecker} typeChecker - The TypeScript type checker
 * @returns {any} - The extracted literal value
 */
export function getLiteralValue(node, typeChecker) {
    if (!node) return undefined;

    if (ts.isLiteralExpression(node) || ts.isBooleanLiteral(node)) {
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
            return (node).elements.map(element => getLiteralValue(element, typeChecker));
        case ts.SyntaxKind.ObjectLiteralExpression:
            return handleObjectLiteral(node, typeChecker);
        case ts.SyntaxKind.Identifier:
            return resolveIdentifier(node, typeChecker);
        case ts.SyntaxKind.PropertyAccessExpression:
            return resolvePropertyAccess(node, typeChecker);
        case ts.SyntaxKind.ParenthesizedExpression:
            return getLiteralValue((node).expression, typeChecker);
        case ts.SyntaxKind.PrefixUnaryExpression:
            return evaluatePrefixUnaryExpression(node, typeChecker);
        default:
            return undefined;
    }
}

/**
 * If the given node is a string literal, returns the parsed string.
 * @param {import('typescript').Node} node - The node to check
 * @returns {string} - The parsed string
 */
export const parseStringNode = (node) => {
    if (node.kind !== ts.SyntaxKind.StringLiteral) {
        if  (ts.isPropertyAssignment(node.parent) || ts.isPropertyDeclaration(node.parent)) {
            throw new ParsingError(node, `"${node.parent.getText()}" must be defined with a string literal.`);
        }
        return '';
    }
    return node.getText().slice(1, -1);
};

export const parseArrayLiteralNode = (node, isArgument = false) => {
    if (node.kind !== ts.SyntaxKind.ArrayLiteralExpression) {
        if  (ts.isPropertyAssignment(node.parent) || ts.isPropertyDeclaration(node.parent) || isArgument) {
            throw new ParsingError(node, `"${node.parent.getText()}" must be defined with an array literal.`);
        }
        return [];
    }
    return JSON.parse(node.getText());
};

/**
 * Parses the first argument as an array literal.
 * @param {ts.Node[]} args - The arguments to parse
 * @returns {number[]} - The parsed array
 */
export const parseArrayLiteral = (args) => {
    if (args.length > 0) {
        return parseArrayLiteralNode(args[0], true);
    }
    return [];
};
