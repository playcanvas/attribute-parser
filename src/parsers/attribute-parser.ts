import type { VirtualTypeScriptEnvironment } from '@typescript/vfs';
import * as ts from 'typescript';

import { hasTag } from '../utils/attribute-utils.ts';
import { parseTag, validateTag } from '../utils/tag-utils.ts';
import { getLiteralValue, getType } from '../utils/ts-utils.ts';
import type { InternalNode, LiteralValue } from '../utils/ts-utils.ts';

import { ParsingError } from './parsing-error.ts';

export type TagDefinition = {
    /** The type of the tag */
    type: string;
    /** A function to generate a support message for the tag */
    supportMessage?: () => string;
    /** A string to fix the tag */
    fix?: string;
};

export type TypeSerializer = (node: ts.Node, typeChecker?: ts.TypeChecker) => LiteralValue;

/**
 * The internal representation of a parsed attribute. Known fields are set while parsing;
 * custom block tags (e.g. @placeholder, @size) land on the index signature.
 */
export type AttributeData = {
    /** The resolved type, replaced with its lowercased type name on output */
    type: ts.Type | string;
    /** The name of the attribute */
    name: string;
    /** The type name, removed on output */
    typeName?: string;
    /** Whether the attribute is an array type */
    array: boolean;
    /** The serialized value, moved to default on output */
    value?: LiteralValue;
    /** The enum members, removed on output when empty */
    enum?: Record<string, LiteralValue>[];
    description?: string;
    range?: number[];
    min?: number;
    max?: number;
    attributes?: Record<string, AttributeData>;
    schema?: AttributeData[];
    resource?: string;
    assetType?: string;
    default?: LiteralValue;
    enabledif?: string;
    visibleif?: string;
    [key: string]: unknown;
};

/**
 * A class to parse JSDoc comments and extract attribute metadata.
 */
export class AttributeParser {
    env: VirtualTypeScriptEnvironment;

    tagTypeAnnotations: Map<string, TagDefinition>;

    typeSerializerMap: Map<string, TypeSerializer>;

    program: ts.Program;

    typeChecker: ts.TypeChecker;

    /**
     * Creates a new instance of the ScriptParser class.
     *
     * @param tags - An set of tag definitions and their validators to add to the parser
     * @param env - The TypeScript environment to use
     * @param typeSerializerMap - A map of custom serializers
     */
    constructor(
        tags = new Map<string, TagDefinition>(),
        env: VirtualTypeScriptEnvironment,
        typeSerializerMap: Map<string, TypeSerializer>
    ) {
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
     * @param node - The node to parse
     * @param errors - An array to store any parsing errors
     * @param requiresAttributeTag - Whether the comment must have an attribute tag
     * @param scriptName - The name of the script this node belongs to
     * @param attributeName - The name of the attribute this node belongs to
     * @returns The extracted metadata or undefined if no metadata was found
     */
    parseAttributeComment(
        node: ts.Node,
        errors: ParsingError[] = [],
        requiresAttributeTag = true,
        scriptName?: string,
        attributeName?: string
    ) {
        // Check if the comment has an attribute tag
        if (!requiresAttributeTag || hasTag('attribute', node)) {
            // Fetch the primary attribute metadata
            const attribute = this.getNodeAsAttribute(node, errors, scriptName);

            if (!attribute) return;

            // Extract the description from the summary section. The comment is a NodeArray
            // rather than a string when it contains inline tags like {@link}, so flatten it
            attribute.description = ts.getTextOfJSDocComment((node as InternalNode).jsDoc?.[0]?.comment) ?? '';

            // Extract metadata from custom tags
            const jsDocTags: readonly ts.JSDocTag[] = (node as InternalNode).jsDoc?.[0]?.tags ?? [];
            jsDocTags.forEach((tag) => {
                // Only use the first line of the comment
                const tagName = tag.tagName.text;
                let commentText = (ts.getTextOfJSDocComment(tag.comment) ?? '').split('\n')[0].trim();

                // Check if the tag is a supported tag
                if (this.tagTypeAnnotations.has(tagName)) {
                    const { type, supportMessage, fix } = this.tagTypeAnnotations.get(tagName);
                    try {
                        const value = parseTag(commentText);

                        // Tags like @resource with string values do not need quotations, so we need to manually add them
                        if (typeof value === 'string') commentText = `"${commentText}"`;

                        validateTag(commentText, type, this.env);
                        attribute[tagName] = value;
                    } catch {
                        // generate a fix if one is provided
                        let startPos = tag.getStart();
                        let endPos = tag.getEnd();

                        const fullText = tag.getText();
                        const commentText = (ts.getTextOfJSDocComment(tag.comment) ?? '').split('\n')[0].trim();

                        // Find the start of the comment content within the full text
                        const commentStart = fullText.indexOf(commentText);
                        if (commentStart !== -1) {
                            startPos = tag.getStart() + commentStart;
                            endPos = startPos + commentText.length;
                        }

                        const sourceFile = tag.getSourceFile();
                        const startLineChar = sourceFile.getLineAndCharacterOfPosition(startPos);
                        const endLineChar = sourceFile.getLineAndCharacterOfPosition(endPos);

                        const edit = fix
                            ? {
                                  text: fix,
                                  title: `Fix @${tagName} tag`,
                                  range: {
                                      startLineNumber: startLineChar.line + 1,
                                      startColumn: startLineChar.character + 1,
                                      endLineNumber: endLineChar.line + 1,
                                      endColumn: endLineChar.character + 1
                                  }
                              }
                            : null;

                        const errorMessage = supportMessage?.() ?? 'The tag is invalid.';
                        const parseError = new ParsingError(
                            tag,
                            `Invalid Tag '@${tagName}'`,
                            errorMessage,
                            edit,
                            scriptName,
                            attributeName
                        );
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
     * @param node - The node to parse
     * @param errors - An array to store any parsing errors
     * @param scriptName - The name of the script this node belongs to
     * @returns The extracted members
     */
    getNodeAsAttribute(node: ts.Node, errors: ParsingError[] = [], scriptName?: string) {
        const nameNode = (node as InternalNode).name;
        const name = (nameNode && ts.isIdentifier(nameNode) && nameNode.text) as string;

        // null for names that aren't identifiers (#private, ['computed'], 'quoted', 42), which can't be attributes
        const nodeType = getType(node, this.typeChecker);
        if (!nodeType) return;

        const { type, name: typeName, array, isMixedUnion } = nodeType;

        const enums = this.getEnumMembers(node, errors);
        let value: LiteralValue = null;

        // If this is not an enum and the type is a mixed union, ie 'a' | false | 1,
        // we need to raise an error as this is not a supported attribute type
        if (isMixedUnion && enums.length === 0) {
            errors.push(
                new ParsingError(
                    node,
                    'Invalid Type',
                    'Mixed literal union types (combining different primitive types like string | number) are not supported. ' +
                        'Use a union of the same primitive type (e.g., \'1 | 2 | 3\' or \'"a" | "b" | "c"\') or refactor your type.',
                    undefined,
                    scriptName,
                    name
                )
            );
            return;
        }

        // we don't need to serialize the value for arrays
        const serializer = !array && this.typeSerializerMap.get(typeName);
        if (serializer) {
            try {
                value = serializer((node as InternalNode).initializer ?? node, this.typeChecker);
            } catch (error) {
                // Enrich any thrown ParsingError with context
                if (error && typeof error === 'object') {
                    error.scriptName = scriptName;
                    error.attributeName = name;
                }
                errors.push(error);
                return;
            }
        }

        const attribute: AttributeData = { type, name, typeName, array, value, enum: enums };
        return attribute;
    }

    /**
     * Extracts the members of an enum from a TypeScript node.
     *
     * @param node - The TypeScript node to analyze
     * @param _errors - An array to store any parsing errors
     * @returns An array of enum members
     */
    getEnumMembers(node: ts.Node, _errors: ParsingError[]) {
        let typeNode: InternalNode | ts.JSDocTypeExpression | null = null;
        let members: Record<string, LiteralValue>[] = [];

        // Check if there's a type annotation directly on the variable declaration
        if ((node as InternalNode).type) {
            typeNode = node;
        } else {
            // Check for JSDoc annotations
            const jsDocs = ts.getJSDocTags(node);
            const typeTag = jsDocs.find((doc) => doc.tagName.text === 'type');
            if (typeTag && ts.isJSDocTypeTag(typeTag)) {
                typeNode = typeTag.typeExpression;
            }
        }

        // Also consider the elementType
        const type = typeNode && ((typeNode.type as ts.ArrayTypeNode).elementType ?? typeNode.type);

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
                            members = declaration.members.map((member) => {
                                const name = (member.name as ts.Identifier).text;
                                let value;
                                if (member.initializer) {
                                    value = getLiteralValue(member.initializer, this.typeChecker);
                                }
                                return { [name]: value };
                            });
                        }

                        // Additionally check for JSDoc enum tag
                        const jsDocs = ts.getJSDocTags(declaration);
                        const enumTag = jsDocs.find((doc) => doc.tagName.text === 'enum');
                        if (enumTag && ts.isJSDocEnumTag(enumTag)) {
                            // This assumes enum members are correctly annotated in JSDoc comments
                            // Example: @enum {type} EnumName { Member1, Member2 }
                            members = members.concat(this.getMembers((declaration as InternalNode).initializer)); // declaration.initializer.properties.map(member => member.name.getText());
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
     * @param node - The node to parse
     * @returns The extracted members
     */
    getMembers(node: ts.Node) {
        const members: Record<string, LiteralValue>[] = [];

        if (ts.isObjectLiteralExpression(node)) {
            node.properties.forEach((property) => {
                if (ts.isPropertyAssignment(property)) {
                    const isValidName = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name);
                    const name = isValidName && (property.name as ts.Identifier | ts.StringLiteral).text;
                    const value = getLiteralValue(property.initializer, this.typeChecker);
                    members.push({ [name as string]: value });
                }
            });
        }

        return members;
    }
}
