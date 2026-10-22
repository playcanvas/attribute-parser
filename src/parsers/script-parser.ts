import type { VirtualTypeScriptEnvironment } from '@typescript/vfs';
import * as ts from 'typescript';

import { getTag, hasTag } from '../utils/attribute-utils.ts';
import { zipArrays } from '../utils/generic-utils.ts';
import {
    flatMapAnyNodes,
    getJSDocTags,
    getLiteralValue,
    parseArrayLiteral,
    parseFloatNode
} from '../utils/ts-utils.ts';
import type { InternalNode } from '../utils/ts-utils.ts';

import { AttributeParser } from './attribute-parser.ts';
import type { AttributeData, TagDefinition, TypeSerializer } from './attribute-parser.ts';
import { ParsingError } from './parsing-error.ts';
import type { Fix } from './parsing-error.ts';

export type Attribute = {
    /** The type of the attribute */
    type: string;
    /** Whether the attribute is an array type of not */
    array: boolean;
    /** The description of the attribute */
    description?: string;
    /** Placeholder for Editor's for field UI. */
    placeholder?: string;
    /** The default value of the attribute */
    defaultValue?: unknown;
    /** An array of possible values for the attribute */
    enum?: Record<string, number | boolean | string>[];
    /** Numerical constraints for the attribute */
    range?: { min: number; max: number };
    /** Numerical constraints for the attribute */
    precision?: number;
    /** Numerical constraints for the attribute */
    step?: number;
    /** Name of asset type to be used in 'asset' type attribute */
    resource?: string;
};

export type ValidationError = {
    /** The error message */
    message: string;
    /** The file the error occurred in */
    file?: string;
    /** The line the error occurred on */
    line?: number;
    /** The column the error occurred on */
    column?: number;
    /** The length of the error */
    length?: number;
};

/**
 * Creates a parser for new expressions.
 *
 * @param name - The name of the type
 * @param argProcessor - Function to process arguments
 * @param defaultArr - The default array to use if the node is not a valid array
 * @returns The parser function that extracts the values from the node
 */
const createNewExpressionParser = (
    name: string,
    argProcessor: (args: readonly ts.Node[]) => number[],
    defaultArr: number[] = []
) => {
    return (node: ts.Node) => {
        if (node.kind !== ts.SyntaxKind.NewExpression) {
            if (ts.isPropertyAssignment(node.parent) || ts.isPropertyDeclaration(node.parent)) {
                // scriptName/attributeName will be filled by caller if caught
                throw new ParsingError(
                    node,
                    'Invalid Property',
                    `Property "${((node as InternalNode).name as ts.Identifier).text}" is not a ${name}.`
                );
            }
            return defaultArr;
        }
        const args = argProcessor((node as ts.NewExpression).arguments);

        // combine the two arrays together, filling any missing values with the defaultArr
        return zipArrays(args, defaultArr);
    };
};

/**
 * Parses single arguments directly.
 * @param args - The arguments to parse
 * @returns The parsed arguments
 */
const parseNumberArguments = (args: readonly ts.Node[]) => args.map((arg) => parseFloatNode(arg, true));

// Creating specific parser instances
const createNumberArgumentParser = (name: string, defaultArr: number[] = []) =>
    createNewExpressionParser(name, parseNumberArguments, defaultArr);

const createArrayArgumentParser = (name: string, defaultArr: number[] = []) =>
    createNewExpressionParser(name, parseArrayLiteral, defaultArr);

/**
 * Map of pc types that can be initialized with values and their corresponding argument parsers.
 * eg `new Vec3(1, 2, 3)`
 */
const SUPPORTED_INITIALIZABLE_TYPE_NAMES = new Map<string, TypeSerializer>([
    ['Curve', createArrayArgumentParser('Curve')],
    ['Vec2', createNumberArgumentParser('Vec2', [0, 0])],
    ['Vec3', createNumberArgumentParser('Vec3', [0, 0, 0])],
    ['Vec4', createNumberArgumentParser('Vec4', [0, 0, 0, 0])],
    ['Color', createNumberArgumentParser('Color', [1, 1, 1, 1])],
    ['number', getLiteralValue],
    ['string', getLiteralValue],
    ['boolean', getLiteralValue]
]);

/**
 * The full set of supported PlayCanvas types.
 */
const SUPPORTED_PLAYCANVAS_TYPES = new Set(['Curve', 'Asset', 'Entity', 'Vec2', 'Vec3', 'Vec4', 'Color']);

/**
 * Checks if a node is a supported PlayCanvas type.
 * @param node - The node to check
 * @returns True if the node is a supported PlayCanvas type
 */
const isSupportedPlayCanvasNode = (node: ts.Node) => {
    return ts.isClassDeclaration(node) && SUPPORTED_PLAYCANVAS_TYPES.has(node.name.text);
};

// valid values for asset.type
const EDITOR_ASSET_TYPES = [
    'animation',
    'animstategraph',
    'audio',
    'bundle',
    'binary',
    'container',
    'cubemap',
    'css',
    'font',
    'folder',
    'json',
    'html',
    'gsplat',
    'material',
    'model',
    'render',
    'scene',
    'script',
    'shader',
    'sprite',
    'template',
    'text',
    'texture',
    'textureAtlas',
    'wasm'
];

const resourceTypesAsUnion = EDITOR_ASSET_TYPES.map((type) => `"${type}"`).join('|');

/**
 * The set of supported block tags and their valid types and support messages when they are malformed or invalid.
 */
const SUPPORTED_BLOCK_TAGS = new Map<string, TagDefinition>([
    [
        'resource',
        {
            type: resourceTypesAsUnion,
            supportMessage: () =>
                `@resource is malformed or invalid. The tag should be formatted as "@resource ${resourceTypesAsUnion}".`,
            fix: 'texture'
        }
    ],
    [
        'color',
        {
            type: '"r"|"rg"|"rgb"|"rgba"',
            supportMessage: () =>
                '@color is malformed or invalid. The tag should be formatted as "@color r", "@color rg", "@color rgb", or "@color rgba".',
            fix: 'rgb'
        }
    ],
    [
        'curves',
        {
            type: '["x"] | ["x", "y"] | ["x", "y", "z"] | ["x", "z"] | ["y"] | ["y", "z"] | ["z"]',
            supportMessage: () =>
                '@curves is malformed or invalid. The tag should be formatted as "@curves x", "@curves x y", "@curves x y z", "@curves x z", "@curves y", "@curves y z", or "@curves z".',
            fix: '["x"]'
        }
    ],
    [
        'range',
        {
            type: 'number[]',
            supportMessage: () => '@range is malformed or invalid. The tag should be formatted as "@range [0, 100]".',
            fix: '[0, 100]'
        }
    ],
    [
        'placeholder',
        {
            type: 'string',
            supportMessage: () =>
                '@placeholder is malformed or invalid. The tag should be formatted as "@placeholder "My Placeholder"".',
            fix: '"My Placeholder"'
        }
    ],
    [
        'precision',
        {
            type: 'number',
            supportMessage: () =>
                '@precision is malformed or invalid. The tag should be formatted as "@precision 0.1".',
            fix: '0.1'
        }
    ],
    [
        'size',
        {
            type: 'number',
            supportMessage: () => '@size is malformed or invalid. The tag should be formatted as "@size 100".',
            fix: '100'
        }
    ],
    [
        'step',
        {
            type: 'number',
            supportMessage: () => '@step is malformed or invalid. The tag should be formatted as "@step 1".',
            fix: '1'
        }
    ],
    [
        'title',
        {
            type: 'string',
            supportMessage: () =>
                '@title is malformed or invalid. The tag should be formatted as "@title "My Attribute"".',
            fix: '"My Attribute"'
        }
    ],
    ['default', { type: 'any' }],
    ['enabledif', { type: 'any' }],
    ['visibleif', { type: 'any' }]
]);

/**
 * A mapping function that transforms the Script Parsers internal representation of an attribute to a required output.
 * @param attribute - The attribute to map
 * @returns The mapped attribute
 */
const mapAttributesToOutput = (attribute: AttributeData) => {
    attribute.type = attribute.typeName.toLowerCase();

    // Flatten the range into min and max
    if (attribute.range) {
        if (attribute.range.length > 0) {
            attribute.min = attribute.range[0];
            if (attribute.range.length > 1) {
                attribute.max = attribute.range[1];
            }
        }
        delete attribute.range;
    }

    // We have a complex type, map to json schema
    if (typeof attribute.attributes == 'object') {
        attribute.type = 'json';
        attribute.schema = Object.keys(attribute.attributes).map((key) => {
            return attribute.attributes[key];
        });
        delete attribute.attributes;
    }

    // 'color' type needs to be mapped to 'rgba'
    if (attribute.type === 'color') {
        attribute.type = 'rgba';
    }

    // 'resource' type needs to be mapped to 'assetType'
    if (attribute.resource) {
        attribute.assetType = attribute.resource;
        delete attribute.resource;
    }

    // remove enum if it's empty
    if (attribute.enum.length === 0) delete attribute.enum;

    // If the attribute has no default value then set it
    if (attribute.value === undefined) {
        if (attribute.type === 'string') attribute.value = '';
        if (attribute.type === 'number') attribute.value = 0;
        if (attribute.type === 'boolean') attribute.value = false;
    }

    // set the default value
    if (attribute.value !== undefined) attribute.default = attribute.default ?? attribute.value;

    // Curve Attributes specifically should not expose a default value if it's an empty array
    if (attribute.type === 'curve' && Array.isArray(attribute.value) && attribute.value.length === 0) {
        delete attribute.default;
    }

    // enabledif is in a {}, so strip it out
    if (attribute.enabledif?.startsWith('{') && attribute.enabledif?.endsWith('}')) {
        attribute.enabledif = attribute.enabledif.slice(1, -1);
    }

    // enabledif is in a {}, so strip it out
    if (attribute.visibleif?.startsWith('{') && attribute.visibleif?.endsWith('}')) {
        attribute.visibleif = attribute.visibleif.slice(1, -1);
    }

    // remove typeName from the output
    delete attribute.typeName;
    delete attribute.value;

    return attribute;
};

export type ParserOptions = {
    /** The attributes object to add to */
    attributes?: Record<string, AttributeData>;
    /** The array to store parsing errors */
    errors?: ParsingError[];
    /** Whether the attribute requires an @attribute tag */
    requiresAttributeTag?: boolean;
    /** The current recursion depth */
    depth?: number;
    /** The current script name for context */
    scriptName?: string;
};

/**
 * A class to parse ESM Scripts and extract attribute metadata from JSDoc comments.
 * This class uses the TypeScript compiler API to parse the script and extract the metadata.
 */
export class ScriptParser {
    env: VirtualTypeScriptEnvironment;

    program: ts.Program;

    typeChecker: ts.TypeChecker;

    maxDepth: number;

    typeSerializerMap: Map<string, TypeSerializer>;

    allSupportedTypesSet: Set<ts.Type>;

    attributeParser: AttributeParser;

    /**
     * @param env - The TypeScript virtual environment
     * @param maxDepth - The maximum recursion depth
     */
    constructor(env: VirtualTypeScriptEnvironment, maxDepth = 2) {
        if (!env) {
            throw new Error('A TypeScript Environment must be provided to the ScriptParser.');
        }

        this.env = env;
        this.program = env.languageService.getProgram();
        this.typeChecker = this.program.getTypeChecker();
        this.maxDepth = maxDepth;

        // Initialize the supported types
        const playcanvasTypesFile = this.program.getSourceFile('./playcanvas.d.ts');

        if (!playcanvasTypesFile) {
            throw new Error('The PlayCanvas types file could not be found.');
        }

        // Return an array of all nodes that are supported PlayCanvas types eg Vec3, Color, etc.
        const allSupportedTypes = flatMapAnyNodes(playcanvasTypesFile, isSupportedPlayCanvasNode).map((node) =>
            this.typeChecker.getTypeAtLocation(node)
        );

        // Add primitive types
        allSupportedTypes.push(this.typeChecker.getStringType());
        allSupportedTypes.push(this.typeChecker.getNumberType());
        allSupportedTypes.push(this.typeChecker.getBooleanType());

        this.typeSerializerMap = new Map();
        this.allSupportedTypesSet = new Set(allSupportedTypes);

        allSupportedTypes.forEach((type) => {
            const typeName = this.typeChecker.typeToString(type);
            const serializer = SUPPORTED_INITIALIZABLE_TYPE_NAMES.get(typeName);
            if (serializer) {
                this.typeSerializerMap.set(typeName, serializer);
            }
        });

        this.attributeParser = new AttributeParser(SUPPORTED_BLOCK_TAGS, env, this.typeSerializerMap);
    }

    /**
     * Checks a program for compile errors and returns a list of formatted error messages.
     * @param errors - The array to store error messages
     * @returns True if the program has no errors, false otherwise
     */
    validateProgram(errors: ValidationError[] = []) {
        // Report any compiler errors
        const compilerDiagnostics = this.program.getSyntacticDiagnostics();

        if (compilerDiagnostics.length > 0) {
            for (const diagnostic of compilerDiagnostics) {
                const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                if (diagnostic.file) {
                    const location = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                    errors.push({
                        message,
                        file: diagnostic.file.fileName,
                        line: location.line + 1,
                        column: location.character + 1,
                        length: diagnostic.length
                    });
                } else {
                    errors.push({
                        message
                    });
                }
            }
        }

        return errors.length === 0;
    }

    /**
     * Extracts Script Attributes from JSDoc style tag from a AST node
     *
     * @param node - The TypeScript node to analyze
     * @param opts - The input options
     * @returns The extracted attributes
     */
    extractAttributes(node: ts.Node, opts: ParserOptions = {}) {
        // Default params
        const attributes = opts.attributes || {};
        const errors = opts.errors ?? [];
        const requiresAttributeTag = opts.requiresAttributeTag ?? true;
        const depth = opts.depth ?? 0;
        const scriptName = opts.scriptName ?? undefined;

        // return early if we've reached the maximum depth
        if (depth > 10) {
            return attributes;
        }

        // Find "/** */" style comments associated with this node.
        const members = getJSDocTags(node, this.typeChecker);

        // Parse the comments for attribute metadata
        for (const { member, memberName } of members) {
            // Parse the comment for attribute metadata
            const attributeMetadata = this.attributeParser.parseAttributeComment(
                member,
                errors,
                requiresAttributeTag,
                scriptName,
                memberName
            );

            // If we found metadata, extract the type and add it to the found attributes
            if (attributeMetadata) {
                // type is still the resolved ts.Type here; it only becomes a string on output
                const type = attributeMetadata.type as ts.Type;
                const { typeName } = attributeMetadata;
                const initializer = (member as InternalNode).initializer;

                if (typeName === 'any') {
                    const supportedTypes = Array.from(SUPPORTED_INITIALIZABLE_TYPE_NAMES.keys()).join(', ');

                    let errorMessage;
                    if (initializer) {
                        errorMessage = `This attribute is initialized with an invalid type. An attribute should be one of the following: ${supportedTypes}.`;
                    } else {
                        errorMessage = `This attribute has an invalid @type tag. An attribute should be one of the following: ${supportedTypes}.`;
                    }
                    const error = new ParsingError(
                        member,
                        'Invalid Type',
                        errorMessage,
                        // pre-existing quirk: the script name is passed in the fix slot
                        (node as InternalNode).name.getText() as unknown as Fix,
                        memberName,
                        undefined
                    );
                    errors.push(error);
                    continue;
                } else if (!this.allSupportedTypesSet.has(type) && attributeMetadata.enum.length === 0) {
                    // If this is a complex type, but not an enum, we may need to recurse through it's nested nested properties

                    // extract attributes for the Types properties
                    const symbol = type.aliasSymbol || type.symbol;
                    const typeNode = (symbol?.valueDeclaration || symbol?.declarations?.[0]) as InternalNode;

                    // Type constraints: Must be either an interface, typedef or initialized object literal, or a jsdoc type literal
                    // types without a declaration (tuples, unresolved or empty types) are reported as invalid below
                    const typeIsJSDocTypeDef = !!typeNode && ts.isJSDocTypedefTag(typeNode);
                    const typeIsInterface =
                        !!typeNode && (hasTag('interface', typeNode) || ts.isInterfaceDeclaration(typeNode));
                    const isInitialized =
                        !!initializer && ts.isObjectLiteralExpression(initializer) && initializer.properties.length > 0;
                    const isJSDocTypeLiteral = !!typeNode && type.symbol?.name === '__type';

                    // Check if the type is a valid interface
                    if (!isInitialized && !typeIsInterface && !typeIsJSDocTypeDef && !isJSDocTypeLiteral) {
                        let error;
                        const typeTag = getTag('type', member) as ts.JSDocTypeTag | null;
                        const supportedTypes = Array.from(SUPPORTED_INITIALIZABLE_TYPE_NAMES.keys()).join(', ');

                        if (typeTag) {
                            // If the attribute has a type tag, add an error that references the @type tag
                            error = new ParsingError(
                                typeTag.typeExpression,
                                'Invalid Type',
                                `"${typeTag.typeExpression.getText()}" is not a valid attribute type. An attribute should be one of the following: ${supportedTypes}`,
                                undefined,
                                (node as InternalNode).name.getText(),
                                memberName
                            );
                        } else if (initializer) {
                            // If the attribute is initialized with an invalid type, add an error associated with the initializer
                            error = new ParsingError(
                                initializer,
                                'Invalid Type',
                                `"${initializer.getText()}" is not a valid attribute type. An attribute should be one of the following: ${supportedTypes}`,
                                undefined,
                                (node as InternalNode).name.getText(),
                                memberName
                            );
                        } else {
                            // If the attribute does not have a type tag or initializer, add an error that references the member
                            error = new ParsingError(
                                member,
                                'Invalid Type',
                                `Attribute is an invalid type. An attribute should be one of the following: ${supportedTypes}`,
                                undefined,
                                (node as InternalNode).name.getText(),
                                memberName
                            );
                        }

                        errors.push(error);
                        continue;
                    }

                    // Extract the attributes from the nested type
                    const members: readonly ts.Node[] =
                        typeNode.members ?? // interface members
                        typeNode.properties ?? // an object literals properties
                        Array.from(type.symbol.members as unknown as Iterable<[string, ts.Symbol]>).map(
                            (entry) => entry[1].declarations[0]
                        ) ?? // a typedefs property declarations
                        [];

                    // If the type is an interface or an initialized object, we need to parse the attribute comments, if not, just the intitialized object
                    let commentAttributes;
                    if (typeIsInterface || isInitialized) {
                        commentAttributes = this.extractAttributes(typeNode, {
                            errors,
                            requiresAttributeTag: false,
                            depth: depth + 1,
                            scriptName
                        });
                    }

                    // Iterate through the nested attributes and extract their metadata
                    const nestedAttributes = members.reduce((attributes: Record<string, AttributeData>, prop) => {
                        const attribute = this.attributeParser.getNodeAsAttribute(prop, errors, scriptName);

                        // If the attribute is a supported type, add it to the list of found attributes
                        if (attribute && this.allSupportedTypesSet.has(attribute.type as ts.Type)) {
                            attributes[attribute.name] = mapAttributesToOutput(attribute);
                        }

                        return attributes;
                    }, {});

                    // Merge the property and comment attributes
                    const mergedAttributes = { ...nestedAttributes, ...commentAttributes };

                    // Add the nested attributes to the attribute metadata
                    attributeMetadata.attributes = mergedAttributes;
                }

                // Add the attribute to the list of found attributes
                attributes[memberName] = mapAttributesToOutput(attributeMetadata);
            }
        }

        return attributes;
    }
}
