import * as ts from 'typescript';

import { AttributeParser } from './attribute-parser.js';
import { ParsingError } from './parsing-error.js';
import { hasTag } from '../utils/attribute-utils.js';
import { zipArrays } from '../utils/generic-utils.js';
import { flatMapAnyNodes, getJSDocTags, getLiteralValue, parseArrayLiteral, parseFloatNode } from '../utils/ts-utils.js';

/**
 * @typedef {object} Attribute
 * @property {string} type - The type of the attribute
 * @property {boolean} array - Whether the attribute is an array type of not
 * @property {string} [description] - The description of the attribute
 * @property {string} [placeholder] - Placeholder for Editor's for field UI.
 * @property {*} [defaultValue] - The default value of the attribute
 * @property {Object<string, number|boolean|string>[]} [enum] - An array of possible values for the attribute
 * @property {{ min: number, max: number}} [range] - Numerical constraints for the attribute
 * @property {number} [precision] - Numerical constraints for the attribute
 * @property {number} [step] - Numerical constraints for the attribute
 * @property {string} [resource] - Name of asset type to be used in 'asset' type attribute
 */

/**
 * @typedef {object} ValidationError
 * @property {string} message - The error message
 * @property {string} [file] - The file the error occurred in
 * @property {number} [line] - The line the error occurred on
 * @property {number} [column] - The column the error occurred on
 * @property {number} [length] - The length of the error
 */

/**
 * Creates a parser for new expressions.
 *
 * @param {string} name - The name of the type
 * @param {Function} argProcessor - Function to process arguments
 * @param {number[]} [defaultArr] - The default array to use if the node is not a valid array
 * @returns {Function} - The parser function that extracts the values from the node
 */
const createNewExpressionParser = (name, argProcessor, defaultArr = []) => {
    return (node) => {
        if (node.kind !== ts.SyntaxKind.NewExpression) {
            if (ts.isPropertyAssignment(node.parent) || ts.isPropertyDeclaration(node.parent)) {
                throw new ParsingError(node, 'Invalid Property', `Property "${node.name.text}" is not a ${name}.`);
            }
            return defaultArr;
        }
        const args = argProcessor(node.arguments);

        // combine the two arrays together, filling any missing values with the defaultArr
        return zipArrays(args, defaultArr);
    };
};

/**
 * Parses single arguments directly.
 * @param {ts.Node[]} args - The arguments to parse
 * @returns {number[]} - The parsed arguments
 */
const parseNumberArguments = args => args.map(arg => parseFloatNode(arg, true));

// Creating specific parser instances
const createNumberArgumentParser = (name, defaultArr = []) => (
    createNewExpressionParser(name, parseNumberArguments, defaultArr));

const createArrayArgumentParser = (name, defaultArr = []) => (
    createNewExpressionParser(name, parseArrayLiteral, defaultArr));

/**
 * Map of pc types that can be initialized with values and their corresponding argument parsers.
 * eg `new Vec3(1, 2, 3)`
 */
const SUPPORTED_INITIALIZABLE_TYPE_NAMES = new Map([
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
const SUPPORTED_PLAYCANVAS_TYPES = new Set([
    'Curve',
    'Asset',
    'Entity',
    'Vec2',
    'Vec3',
    'Vec4',
    'Color'
]);

/**
 * Checks if a node is a supported PlayCanvas type.
 * @param {ts.Node} node - The node to check
 * @returns {boolean} - True if the node is a supported PlayCanvas type
 */
const isSupportedPlayCanvasNode = (node) => {
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

const resourceTypesAsUnion = EDITOR_ASSET_TYPES.map(type => `"${type}"`).join('|');

/**
 * The set of supported block tags and validators
 */
const SUPPORTED_BLOCK_TAGS = new Map([
    ['resource', resourceTypesAsUnion],
    ['color', '"r"|"rg"|"rgb"|"rgba"'],
    ['curves', '["x"] | ["x", "y"] | ["x", "y", "z"] | ["x", "z"] | ["y"] | ["y", "z"] | ["z"]'],
    ['range', 'number[]'],
    ['placeholder', 'string'],
    ['precision', 'number'],
    ['size', 'number'],
    ['step', 'number'],
    ['title', 'string'],
    ['default', 'any'],
    ['enabledif', 'any'],
    ['visibleif', 'any']
]);

/**
 * A mapping function that transforms the Script Parsers internal representation of an attribute to a required output.
 * @param {*} attribute - The attribute to map
 * @returns {*} - The mapped attribute
 */
const mapAttributesToOutput = (attribute) => {

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

/**
 * A class to parse ESM Scripts and extract attribute metadata from JSDoc comments.
 * This class uses the TypeScript compiler API to parse the script and extract the metadata.
 */
export class ScriptParser {
    /**
     * @param {import('@typescript/vfs').VirtualTypeScriptEnvironment} env - The TypeScript virtual environment
     * @param {number} [maxDepth] - The maximum recursion depth
     */
    constructor(env, maxDepth = 2) {

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
        const allSupportedTypes = flatMapAnyNodes(playcanvasTypesFile, isSupportedPlayCanvasNode).map(node => this.typeChecker.getTypeAtLocation(node));

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
     * @param {ValidationError[]} errors - The array to store error messages
     * @returns {boolean} - True if the program has no errors, false otherwise
     */
    validateProgram(errors = []) {

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
     * @typedef {Object} ParserOptions
     * @property {object} [attributes] - The attributes object to add to
     * @property {ParsingError[]} [errors] - The array to store parsing errors
     * @property {boolean} [requiresAttributeTag] - Whether the attribute requires an @attribute tag
     * @property {number} [depth] - The current recursion depth
     */

    /**
     * Extracts Script Attributes from JSDoc style tag from a AST node
     *
     * @param {import('typescript').Node} node - The TypeScript node to analyze
     * @param {ParserOptions} [opts] - The input options
     * @returns {Attribute[]} - The extracted attributes;
     */
    extractAttributes(node, opts = {}) {

        // Default params
        const attributes = opts.attributes || {};
        const errors = opts.errors ?? [];
        const requiresAttributeTag = opts.requiresAttributeTag ?? true;
        const depth = opts.depth ?? 0;

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
                requiresAttributeTag
            );

            // If we found metadata, extract the type and add it to the found attributes
            if (attributeMetadata) {

                const { type, typeName } = attributeMetadata;
                const initializer = member?.initializer;

                if (typeName === 'any') {

                    let errorMessage;
                    if (!member.initializer) {
                        errorMessage = `The attribute "${memberName}" does not have a valid @type tag.`;
                    } else {
                        errorMessage = `The attribute "${memberName}" either does not have a valid @type tag or is initialized with an invalid type.`;
                    }
                    const error = new ParsingError(member, 'Invalid Type', errorMessage);
                    errors.push(error);
                    continue;

                } else if (!this.allSupportedTypesSet.has(type) && attributeMetadata.enum.length === 0) {
                    // If this is a complex type, but not an enum, we may need to recurse through it's nested nested properties

                    // extract attributes for the Types properties
                    const symbol = type.aliasSymbol || type.symbol;
                    const typeNode = symbol?.valueDeclaration || symbol.declarations?.[0];

                    if (!typeNode) {
                        // The attribute does not have a valid type
                        continue;
                    }

                    // Type constraints: Must be either an interface, typedef or initialized object literal, or a jsdoc type literal
                    const typeIsJSDocTypeDef = ts.isJSDocTypedefTag(typeNode);
                    const typeIsInterface = hasTag('interface', typeNode) || ts.isInterfaceDeclaration(typeNode);
                    const isInitialized = !!initializer && ts.isObjectLiteralExpression(initializer);
                    const isJSDocTypeLiteral = type.symbol.name === '__type';

                    // Check if the type is a valid interface
                    if (!isInitialized && !typeIsInterface && !typeIsJSDocTypeDef && !isJSDocTypeLiteral) {
                        const error = new ParsingError(member, 'Invalid Type', `Attribute "${memberName}" is an invalid type.`);
                        errors.push(error);
                        continue;
                    }

                    // Extract the attributes from the nested type
                    const members = typeNode.members ?? // interface members
                        typeNode.properties ?? // an object literals properties
                        Array.from(type.symbol.members).map(arr => arr[1].declarations[0]) ??  // a typedefs property declarations
                        [];

                    // If the type is an interface or an initialized object, we need to parse the attribute comments, if not, just the intitialized object
                    let commentAttributes;
                    if (typeIsInterface || isInitialized) {
                        commentAttributes = this.extractAttributes(typeNode, { errors, requiresAttributeTag: false, depth: depth + 1 });
                    }

                    // Iterate through the nested attributes and extract their metadata
                    const nestedAttributes = members.reduce((attributes, prop) => {

                        const attribute = this.attributeParser.getNodeAsAttribute(prop, errors);

                        // If the attribute is a supported type, add it to the list of found attributes
                        if (attribute && this.allSupportedTypesSet.has(attribute.type)) {
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
