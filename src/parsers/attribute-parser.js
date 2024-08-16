import { TSDocConfiguration, TSDocTagDefinition, TSDocTagSyntaxKind, TextRange, TSDocParser } from '@microsoft/tsdoc';
import * as ts from 'typescript';

import { ParsingError } from './parsing-error.js';
import { hasTag } from '../utils/attribute-utils.js';
import { parseTag, validateTag } from '../utils/tag-utils.js';
import { extractTextFromDocNode, getLeadingBlockCommentRanges, getType } from '../utils/ts-utils.js';

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

        this.attributeTag = new TSDocTagDefinition({
            tagName: '@attribute', syntaxKind: TSDocTagSyntaxKind.ModifierTag
        });

        this.typeTag = new TSDocTagDefinition({
            tagName: '@type', syntaxKind: TSDocTagSyntaxKind.BlockTag
        });

        const conf = new TSDocConfiguration();
        conf.validation.reportUnsupportedTags = false;

        conf.addTagDefinition(this.attributeTag);

        tags.forEach((_, tag) => {
            const tagDefinition = new TSDocTagDefinition({
                tagName: `@${tag}`, syntaxKind: TSDocTagSyntaxKind.BlockTag, allowMultiple: false
            });
            conf.addTagDefinition(tagDefinition);
        });

        this.parser = new TSDocParser(conf);
    }

    /**
     * Parses a JSdoc comment and extracts any associated metadata if the `@attribute`
     * modifier is used. Returns null if this is not an attribute comment.
     *
     * @param {TextRange} comment - The comment to parse
     * @param {ts.Node} node - The node to parse
     * @param {ParsingError[]} errors - An array to store any parsing errors
     * @param {boolean} requiresAttributeTag - Whether the comment must have an attribute tag
     * @returns {*} - The extracted metadata or null if no metadata was found
     */
    parseAttributeComment(comment, node, errors = [], requiresAttributeTag = true) {

        const parserContext = this.parser.parseRange(comment);
        const docComment = parserContext.docComment;
        const file = node.getSourceFile();

        // Check if the comment has an attribute tag
        if (!requiresAttributeTag || hasTag('attribute', node)) {

            // Fetch the primary attribute metadata
            const attribute = this.getNodeAsAttribute(node, errors);

            if (!attribute) return;

            // Extract the description from the summary section
            const description = extractTextFromDocNode(docComment.summarySection);
            if (description) {
                attribute.description = description.split('.')[0];
            }

            // Extract metadata from custom tags
            const jsDocTags = node.jsDoc?.[0]?.tags ?? [];
            jsDocTags.forEach((tag) => {
                let commentText = tag.comment;

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
                        const { line, character } = file.getLineAndCharacterOfPosition(tag.getStart());
                        const parseError = new ParsingError(tag, `Error (${line}, ${character}): Parsing Tag '@${tag.tagName.text} ${commentText}' - ${error.message}`);
                        errors.push(parseError);
                    }
                }
            });

            return attribute;
        }
    }

    /**
     * Returns the leading block comments for an typescript AST node.
     *
     * @param {import('typescript').Node} node - The node to parse
     * @param {string[]} errors - An array to store any parsing errors
     * @returns {import('@microsoft/tsdoc').DocComment} - The extracted doc comment;
     */
    getCommentsForNode(node, errors = []) {
        const fullText = node.getSourceFile().getFullText();
        const comments = getLeadingBlockCommentRanges(node, fullText);

        if (comments.length === 0) return null;

        const lastComment = comments[0];
        const textRange = TextRange.fromStringRange(fullText, lastComment.pos, lastComment.end);

        const parserContext = this.parser.parseRange(textRange);
        const docComment = parserContext.docComment;

        // Check for comment parsing errors and flag them
        this.populateErrors(node, parserContext, errors);

        return docComment;
    }

    /**
     * Populates the errors array with any parsing errors found in the parser context.
     *
     * @param {import('typescript').Node} node - The node to parse
     * @param {import('@microsoft/tsdoc').ParserContext} parserContext - The parser context to check for errors
     * @param {string[]} errors - An array to store any parsing errors
     */
    populateErrors(node, parserContext, errors) {
        if (parserContext.log.messages.length > 0) {
            const sourceFile = node.getSourceFile();

            const formattedErrors = parserContext.log.messages.map((message) => {
                const location = sourceFile.getLineAndCharacterOfPosition(message.textRange.pos);
                return `${sourceFile.fileName}(${location.line + 1},${location.character + 1}): [TSDoc] ${message}`;
            });

            errors.push(...formattedErrors);
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
        const { type, name: typeName, array } = getType(node, this.typeChecker);
        const enums = this.getEnumMembers(node, errors);
        let value = null;

        // we don't need to serialize the value for arrays
        const serializer = !array && this.typeSerializerMap.get(type);
        if (serializer) {
            try {
                value = serializer(node.initializer ?? node);
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
        if (ts.isVariableDeclaration(node) && node.type) {
            typeNode = node.type;
        } else {
            // Check for JSDoc annotations
            const jsDocs = ts.getJSDocTags(node);
            const typeTag = jsDocs.find(doc => doc.tagName.text === 'type');
            if (typeTag && ts.isJSDocTypeTag(typeTag)) {
                typeNode = typeTag.typeExpression;
            }
        }

        if (typeNode && ts.isTypeReferenceNode(typeNode.type)) {

            // resolve the symbol of the type
            let symbol = this.typeChecker.getSymbolAtLocation(typeNode.type.typeName);

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
                            members = declaration.members.map(member => member.name.getText());
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
                    const name = property.name && ts.isIdentifier(property.name) && property.name.text;
                    let value;

                    const node = property.initializer;

                    // Enums can only contain primitives (string|number|boolean)
                    if (ts.isNumericLiteral(node)) {
                        value = parseFloat(node.getText());
                    } else if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) {
                        value = node.kind === ts.SyntaxKind.TrueKeyword;
                    } else {
                        value = node.getText();
                    }

                    members.push({ [name]: value });
                }
            });
        }

        return members;
    }
}
