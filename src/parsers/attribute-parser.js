import * as ts from 'typescript';

import { ParsingError } from './parsing-error.js';
import { hasTag } from '../utils/attribute-utils.js';
import { parseTag, validateTag } from '../utils/tag-utils.js';
import { getLiteralValue, getType } from '../utils/ts-utils.js';

/**
 * A class to parse JSDoc comments and extract attribute metadata.
 */
export class AttributeParser {
    /**
     * Creates a new instance of the ScriptParser class.
     *
     * @param {Map<string, string>} tags - An set of tag definitions and their validators to add to the parser
     * @param {object} env - The TypeScript environment to use
     * @param {Map<string, Function>} typeSerializerMap - A map of custom serializers
     */
    constructor(tags = new Map(), env, typeSerializerMap) {

        this.env = env;
        this.tagTypeAnnotations = tags;
        this.typeSerializerMap = typeSerializerMap;
        this.program = env.languageService.getProgram();
        this.typeChecker = this.program.getTypeChecker();

    }

    /**
     * Parses a JSdoc comment and extracts any associated metadata if the `@attribute`
     * modifier is used. Returns null if this is not an attribute comment.
     *
     * @param {ts.Node} node - The node to parse
     * @param {ParsingError[]} errors - An array to store any parsing errors
     * @param {boolean} requiresAttributeTag - Whether the comment must have an attribute tag
     * @returns {*} - The extracted metadata or null if no metadata was found
     */
    parseAttributeComment(node, errors = [], requiresAttributeTag = true) {

        // Check if the comment has an attribute tag
        if (!requiresAttributeTag || hasTag('attribute', node)) {

            // Fetch the primary attribute metadata
            const attribute = this.getNodeAsAttribute(node, errors);

            if (!attribute) return;

            // Extract the description from the summary section
            attribute.description = node.jsDoc?.[0]?.comment || '';

            // Extract metadata from custom tags
            const jsDocTags = node.jsDoc?.[0]?.tags ?? [];
            jsDocTags.forEach((tag) => {
                // Only use the first line of the comment
                let commentText = (tag.comment?.split('\n')[0] || '').trim();

                // Check if the tag is a supported tag
                if (this.tagTypeAnnotations.has(tag.tagName.text)) {
                    try {
                        const value = parseTag(commentText);
                        const tagTypeAnnotation = this.tagTypeAnnotations.get(tag.tagName.text);

                        // Tags like @resource with string values do not need quotations, so we need to manually add them
                        if (typeof value === 'string') commentText = `"${commentText}"`;

                        validateTag(commentText, tagTypeAnnotation, this.env);
                        attribute[tag.tagName.text] = value;

                    } catch (error) {
                        const file = node.getSourceFile();
                        const { line, character } = file.getLineAndCharacterOfPosition(tag.getStart());
                        const parseError = new ParsingError(node, `Invalid Tag '@${tag.tagName.text}'`, `Error (${line}, ${character}): Parsing Tag '@${tag.tagName.text} ${commentText}' - ${error.message}`);
                        errors.push(parseError);
                    }
                }
            });

            return attribute;
        }
    }

    /**
     * Extract the public members and their values from a TypeScript node.
     *
     * @param {ts.Node} node - The node to parse
     * @param {ParsingError[]} errors - An array to store any parsing errors
     * @returns {*} - The extracted members
     */
    getNodeAsAttribute(node, errors = []) {

        const name = node.name && ts.isIdentifier(node.name) && node.name.text;
        const { type, name: typeName, array, isMixedUnion } = getType(node, this.typeChecker);

        const enums = this.getEnumMembers(node, errors);
        let value = null;

        // If this is not an enum and the type is a mixed union, ie 'a' | false | 1,
        // we need to raise an error as this is not a supported attribute type
        if (isMixedUnion && enums.length === 0) {
            errors.push(new ParsingError(
                node,
                'Invalid Type',
                'Mixed literal union types (combining different primitive types like string | number) are not supported. ' +
                'Use a union of the same primitive type (e.g., \'1 | 2 | 3\' or \'"a" | "b" | "c"\') or refactor your type.'
            ));
            return;
        }

        // we don't need to serialize the value for arrays
        const serializer = !array && this.typeSerializerMap.get(typeName);
        if (serializer) {
            try {
                value = serializer(node.initializer ?? node, this.typeChecker);
            } catch (error) {
                errors.push(error);
                return;
            }
        }

        return { type, name, typeName, array, value, enum: enums };
    }

    /**
     * Extracts the members of an enum from a TypeScript node.
     *
     * @param {import('typescript').Node} node - The TypeScript node to analyze
     * @param {ParsingError[]} errors - An array to store any parsing errors
     * @returns {Object<string, *>[]} - An array of enum members
     */
    getEnumMembers(node, errors) {
        let typeNode = null;
        let members = [];

        // Check if there's a type annotation directly on the variable declaration
        if (node.type) {
            typeNode = node;
        } else {
            // Check for JSDoc annotations
            const jsDocs = ts.getJSDocTags(node);
            const typeTag = jsDocs.find(doc => doc.tagName.text === 'type');
            if (typeTag && ts.isJSDocTypeTag(typeTag)) {
                typeNode = typeTag.typeExpression;
            }
        }

        // Also consider the elementType
        const type = typeNode && (typeNode.type.elementType ?? typeNode.type);

        if (typeNode && ts.isTypeReferenceNode(type)) {

            // resolve the symbol of the type
            let symbol = this.typeChecker.getSymbolAtLocation(type.typeName);

            // Resolve aliases, which are common with imports
            if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
                symbol = this.typeChecker.getAliasedSymbol(symbol);
            }

            if (symbol) {
                const declarations = symbol.getDeclarations();

                if (declarations && declarations.length > 0) {

                    declarations.forEach((declaration) => {

                        // Check if the declaration is a TypeScript enum
                        if (ts.isEnumDeclaration(declaration)) {
                            members = declaration.members.map(member => ({ [member.name.text]: member.initializer.text }));
                        }

                        // Additionally check for JSDoc enum tag
                        const jsDocs = ts.getJSDocTags(declaration);
                        const enumTag = jsDocs.find(doc => doc.tagName.text === 'enum');
                        if (enumTag && ts.isJSDocEnumTag(enumTag)) {
                            // This assumes enum members are correctly annotated in JSDoc comments
                            // Example: @enum {type} EnumName { Member1, Member2 }
                            members = members.concat(this.getMembers(declaration.initializer, errors)); // declaration.initializer.properties.map(member => member.name.getText());
                        }
                    });
                }
            }
        }

        return members;
    }

    /**
     * Extract the public members and their values from a TypeScript node.
     *
     * @param {ts.Node} node - The node to parse
     * @returns {any[]} - The extracted members
     */
    getMembers(node) {

        const members = [];

        if (ts.isObjectLiteralExpression(node)) {
            node.properties.forEach((property) => {

                if (ts.isPropertyAssignment(property)) {
                    const isValidName = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name);
                    const name = isValidName && property.name.text;
                    const value = getLiteralValue(property.initializer, this.typeChecker);
                    members.push({ [name]: value });
                }
            });
        }

        return members;
    }
}
