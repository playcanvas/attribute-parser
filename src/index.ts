import { createSystem, createDefaultMapFromNodeModules, createVirtualTypeScriptEnvironment } from '@typescript/vfs';
import type { VirtualTypeScriptEnvironment } from '@typescript/vfs';
import * as ts from 'typescript';

import type { AttributeData } from './parsers/attribute-parser.ts';
import { ParsingError } from './parsers/parsing-error.ts';
import { ScriptParser } from './parsers/script-parser.ts';
import type { ValidationError } from './parsers/script-parser.ts';
import { isStaticMember } from './utils/attribute-utils.ts';
import {
    createDefaultMapFromCDN,
    getExportedNodes,
    getType,
    inheritsFrom,
    isAliasedClassDeclaration
} from './utils/ts-utils.ts';
import type { InternalNode } from './utils/ts-utils.ts';

const toLowerCamelCase = (str: string) => str[0].toLowerCase() + str.substring(1);

const SUPPORTED_ATTRIBUTE_TYPES = new Set(['Curve', 'Vec2', 'Vec3', 'Vec4', 'Color', 'number', 'string', 'boolean']);

type ScriptResults = {
    /** The extracted attributes, keyed by attribute name */
    attributes: Record<string, AttributeData>;
    /** The parsing errors for this script */
    errors: ParsingError[];
};

type MemberInfo = {
    /** The name of the member */
    name: string;
    /** Whether the member is a script attribute */
    isAttribute: boolean;
    /** The type of the member, with an array suffix when applicable */
    type: string;
    /** The start of the member, including any JSDoc block */
    start: { line: number; column: number };
    /** The end of the member */
    end: { line: number; column: number };
};

const COMPILER_OPTIONS = {
    noLib: true,
    strict: false,
    skipLibCheck: true, // Skip type checking of declaration files
    target: ts.ScriptTarget.ES2023, // If this version changes, the types must be updated in the /rollup.config.mjs
    module: ts.ModuleKind.CommonJS,
    checkJs: true, // Enable JSDoc parsing
    allowJs: true,
    baseUrl: './',
    paths: {
        playcanvas: ['/playcanvas.js']
    }
};

export class JSDocParser {
    private _env: VirtualTypeScriptEnvironment;

    /**
     * An internal array of program errors
     */
    private _errors: ValidationError[] = [];

    declare parser: ScriptParser;

    declare program: ts.Program;

    /**
     * Initializes the JSDocParser with the standard library files
     *
     * @param libPath - A path to a directory of library types, or a path to the '.d.ts' file itself
     * @returns The initialized JSDocParser
     */
    async init(libPath?: string) {
        if (this._env) {
            return this;
        }

        let fsMap;
        if (!libPath) {
            // This is a node only option. If no lib path is passed, attempt to resolve ES types from node_modules.
            fsMap = await createDefaultMapFromNodeModules(COMPILER_OPTIONS, ts);
        } else if (libPath.endsWith('.d.ts')) {
            // If the libPath is a '.d.ts' file then load it and add it
            const types = await fetch(libPath).then((r) => r.text());
            fsMap = new Map([['/lib.d.ts', types]]);
        } else {
            // A libPath was supplied, but not to a '.d.ts', so assume this is a path to types
            fsMap = await createDefaultMapFromCDN(COMPILER_OPTIONS, libPath, ts);
        }

        // Set up the virtual file system and environment
        const system = createSystem(fsMap);
        this._env = createVirtualTypeScriptEnvironment(system, Array.from(fsMap.keys()), ts, COMPILER_OPTIONS);

        return this;
    }

    /**
     * Creates program from fileName and scriptsContents
     *
     * @param newFiles - An array of [path, content] tuples which represent the files in the program
     * @param removedFiles - An array of file paths that should be removed from the program
     * @returns The program errors
     */
    updateProgram(newFiles: [string, string][] = [], removedFiles: string[] = []) {
        const errors: ValidationError[] = [];

        // Add custom files to the map
        newFiles.forEach(([filePath, fileContent]) => {
            if (this._env.getSourceFile(filePath)) {
                this._env.updateFile(filePath, fileContent);
            } else {
                this._env.createFile(filePath, fileContent);
            }
        });

        // Remove deleted Files
        removedFiles.forEach((filePath) => {
            this._env.deleteFile(filePath);
        });

        this.parser = new ScriptParser(this._env);
        this.program = this._env.languageService.getProgram();

        // Check for compiler errors
        this.parser.validateProgram(errors);

        this._errors = errors;

        return errors;
    }

    /**
     * Returns all the valid ESM Scripts within a file
     * @param fileName - The file name in the program to check
     * @param errors - An array to store any parsing errors
     * @returns A map of valid ESM Script <names, nodes> within the file
     */
    getAllEsmScripts(fileName: string, errors: (ParsingError | ValidationError)[] = []) {
        const typeChecker = this.program.getTypeChecker();

        // Find the Script class in the PlayCanvas namespace
        const pcTypes = this.program.getSourceFile('/playcanvas.d.ts');

        if (!pcTypes) {
            throw new Error('PlayCanvas Types must be supplied');
        }

        const esmScripts = new Map<string, ts.Node>();

        // Parse the source file and pc types
        const sourceFile = this.program.getSourceFile(fileName);

        // In a special edge case where the files contents are empty, the sourcefile will be undefined
        // So we should early out
        if (sourceFile === undefined) {
            return esmScripts;
        }

        if (sourceFile === null) {
            throw new Error(`Source file ${fileName} not found`);
        }

        // Extract all exported nodes
        const nodes = getExportedNodes(this.program, sourceFile);

        const esmScriptClass = (
            pcTypes.statements.find(
                (node) => ts.isClassDeclaration(node) && node.name.text === 'Script'
            ) as InternalNode
        )?.symbol;

        const isScriptNameMember = (member: ts.ClassElement) =>
            ts.isPropertyDeclaration(member) && // Is a property declaration
            ts.isIdentifier(member.name) &&
            member.name.text === 'scriptName' &&
            isStaticMember(member) &&
            ts.isStringLiteral(member.initializer);

        // Check if the file exports a class that inherits from `Script`
        nodes.forEach((node, name) => {
            if (
                isAliasedClassDeclaration(node, typeChecker) &&
                inheritsFrom(node as ts.ClassDeclaration, typeChecker, esmScriptClass)
            ) {
                // Check for a static scriptName property and use that as the name if it exists
                const scriptNameMember = (node as ts.ClassDeclaration).members.find(isScriptNameMember);

                // If the scriptName property exists, use that verbatim as the name
                let finalName;
                if (scriptNameMember) {
                    finalName = ((scriptNameMember as ts.PropertyDeclaration).initializer as ts.StringLiteral).text;
                } else {
                    finalName = toLowerCamelCase(name);
                    const insertOffset = (node as ts.ClassDeclaration).members.pos;
                    const insertPos = node.getSourceFile().getLineAndCharacterOfPosition(insertOffset);

                    errors.push(
                        new ParsingError(
                            node,
                            'Missing Script Name',
                            'Scripts should have a static scriptName member that identifies the script.',
                            {
                                title: 'Add scriptName',
                                text: `\n    static scriptName = '${finalName}';\n`,
                                range: {
                                    startLineNumber: insertPos.line + 1,
                                    startColumn: insertPos.character + 1,
                                    endLineNumber: insertPos.line + 1,
                                    endColumn: insertPos.character + 1
                                }
                            },
                            finalName
                        )
                    );
                }

                esmScripts.set(finalName, node);
            }
        });

        return esmScripts;
    }

    /**
     * Analyzes the specified TypeScript file and extracts metadata from JSDoc comments.
     *
     * @param fileName - The name of the file in the program to run
     * @returns The extracted attributes and errors
     */
    parseAttributes(fileName: string): [Record<string, ScriptResults>, (ParsingError | ValidationError)[]] {
        const results: Record<string, ScriptResults> = {};
        const errors: (ParsingError | ValidationError)[] = [...this._errors];

        if (errors.length > 0) {
            return [results, errors];
        }

        // Extract all exported nodes
        const nodes = this.getAllEsmScripts(fileName, errors);

        // Extract attributes from each script
        nodes.forEach((node, name) => {
            const opts = (results[name] = { attributes: {}, errors: [] as ParsingError[] });
            this.parser.extractAttributes(node, { ...opts, scriptName: name });
        });

        return [results, errors];
    }

    /**
     * Analyzes the specified TypeScript file and extracts metadata from JSDoc comments.
     * @param fileName - The name of the file to run
     * @returns The extracted attributes and errors
     */
    getAttributes(fileName: string): [Record<string, MemberInfo[]>, (ParsingError | ValidationError)[]] {
        const results: Record<string, MemberInfo[]> = {};
        const errors: (ParsingError | ValidationError)[] = [...this._errors];

        if (errors.length > 0) {
            return [results, errors];
        }

        const typeChecker = this.program.getTypeChecker();
        const esmScripts = this.getAllEsmScripts(fileName, errors);
        const [attributes] = this.parseAttributes(fileName);

        const scripts = [];
        for (const [scriptName, node] of esmScripts) {
            const members = [];
            for (const member of (node as ts.ClassDeclaration).members) {
                if (member.kind === ts.SyntaxKind.PropertyDeclaration && !isStaticMember(member)) {
                    members.push(member);
                }
            }
            scripts.push({ scriptName, members });
            errors.push(...(attributes[scriptName]?.errors ?? []));
        }

        for (const { scriptName, members } of scripts) {
            const localMembers: MemberInfo[] = [];
            for (const member of members) {
                const name = member.name.getText();
                const attribute = attributes[scriptName].attributes[name];
                const isAttribute = !!attribute;

                // null for names that aren't identifiers (#private, ['computed'], 'quoted', 42)
                const type = getType(member, typeChecker);

                if (!type || !SUPPORTED_ATTRIBUTE_TYPES.has(type.name)) {
                    continue;
                }

                const namePos = ts.getLineAndCharacterOfPosition(member.getSourceFile(), member.name.getStart());

                const jsDocs = (member as InternalNode).jsDoc;
                const jsdocNode = jsDocs && jsDocs[jsDocs.length - 1];
                const jsdocPos = jsdocNode
                    ? ts.getLineAndCharacterOfPosition(member.getSourceFile(), jsdocNode.getStart())
                    : null;

                localMembers.push({
                    name,
                    isAttribute,
                    type: type.name + (type.array ? '[]' : ''),
                    start: jsdocNode
                        ? { line: jsdocPos.line + 1, column: jsdocPos.character + 1 }
                        : { line: namePos.line + 1, column: namePos.character + 1 },
                    end: { line: namePos.line + 1, column: namePos.character + 1 }
                });
            }

            results[scriptName] = localMembers;
        }

        return [results, errors];
    }
}
