import { createSystem, createDefaultMapFromNodeModules, createVirtualTypeScriptEnvironment } from '@typescript/vfs';
import * as ts from 'typescript';

import { ParsingError } from './parsers/parsing-error.js';
import { ScriptParser } from './parsers/script-parser.js';
import { isStaticMember } from './utils/attribute-utils.js';
import { createDefaultMapFromCDN, getExportedNodes, getType, inheritsFrom, isAliasedClassDeclaration } from './utils/ts-utils.js';

const toLowerCamelCase = str => str[0].toLowerCase() + str.substring(1);

const SUPPORTED_ATTRIBUTE_TYPES = new Set([
    'Curve',
    'Vec2',
    'Vec3',
    'Vec4',
    'Color',
    'number',
    'string',
    'boolean'
]);

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
        'playcanvas': ['/playcanvas.js']
    }
};

export class JSDocParser {
    /**
     * @type {import('@typescript/vfs').VirtualTypeScriptEnvironment}
     * @private
     */
    _env;

    /**
     * An internal array of program errors
     * @private
     */
    _errors = [];

    /**
     * Initializes the JSDocParser with the standard library files
     *
     * @param {string} libPath - A path to a directory of library types, or a path to the '.d.ts' file itself
     * @returns {Promise<JSDocParser>} - The initialized JSDocParser
     */
    async init(libPath) {
        if (this._env) {
            return this;
        }

        let fsMap;
        if (!libPath) {

            // This is a node only option. If no lib path is passed, attempt to resolve ES types from node_modules.
            fsMap = await createDefaultMapFromNodeModules(COMPILER_OPTIONS, ts);

        } else if (libPath.endsWith('.d.ts')) {

            // If the libPath is a '.d.ts' file then load it and add it
            const types = await fetch(libPath).then(r => r.text());
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
     * @param {[string, string][]} newFiles - An array of {[path]: [content]} which represent the files in the program
     * @param {string[]} removedFiles - An array of file paths that should be removed from the program
     * @returns {{ parser: ScriptParser, program: ts.Program,
     * errors: import('./parsers/script-parser.js').ValidationError[]}} - The extracted attributes
     */
    updateProgram(newFiles = [], removedFiles = []) {
        const errors = [];

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
     * @param {string} fileName - The file name in the program to check
     * @param {ParsingError[]} errors - An array to store any parsing errors
     * @returns {Map<string, import('typescript').Node>} - A map of valid ESM Script <names, nodes> within the file
     */
    getAllEsmScripts(fileName, errors = []) {

        const typeChecker = this.program.getTypeChecker();

        // Find the Script class in the PlayCanvas namespace
        const pcTypes = this.program.getSourceFile('/playcanvas.d.ts');

        if (!pcTypes) {
            throw new Error('PlayCanvas Types must be supplied');
        }

        const esmScripts = new Map();

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

        const esmScriptClass = pcTypes.statements.find(node => node.kind === ts.SyntaxKind.ClassDeclaration && node.name.text === 'Script')?.symbol;

        const isScriptNameMember = member => (
            ts.isPropertyDeclaration(member) && // Is a property declaration
            ts.isIdentifier(member.name) &&
            member.name.text === 'scriptName' &&
            isStaticMember(member) &&
            ts.isStringLiteral(member.initializer)
        );

        // Check if the file exports a class that inherits from `Script`
        nodes.forEach((node, name) => {
            if (isAliasedClassDeclaration(node, typeChecker) && inheritsFrom(node, typeChecker, esmScriptClass)) {

                // Check for a static scriptName property and use that as the name if it exists
                const scriptNameMember = node.members.find(isScriptNameMember);

                // If the scriptName property exists, use that verbatim as the name
                let finalName;
                if (scriptNameMember) {
                    finalName = scriptNameMember.initializer.text;
                } else {
                    finalName = toLowerCamelCase(name);
                    const insertOffset = node.members.pos;
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
                            }
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
     * @param {string} fileName - The name of the file in the program to run
     * @returns {[results: object, errors: import('./parsers/script-parser.js').ValidationError[]]} - The extracted attributes
     */
    parseAttributes(fileName) {
        const results = {};
        const errors = [...this._errors];

        if (errors.length > 0) {
            return [results, errors];
        }

        // Extract all exported nodes
        const nodes = this.getAllEsmScripts(fileName, errors);

        // Extract attributes from each script
        nodes.forEach((node, name) => {
            const opts = results[name] = { attributes: {}, errors: [] };
            this.parser.extractAttributes(node, opts);
        });

        return [results, errors];
    }

    /**
     * Analyzes the specified TypeScript file and extracts metadata from JSDoc comments.
     * @param {string} fileName - The name of the file to run
     * @returns {[results: object, errors: import('./parsers/script-parser.js').ValidationError[]]} - The extracted attributes
     */
    getAttributes(fileName) {
        const results = {};
        const errors = [...this._errors];

        if (errors.length > 0) {
            return [results, errors];
        }

        const typeChecker = this.program.getTypeChecker();
        const esmScripts = this.getAllEsmScripts(fileName, errors);
        const [attributes] = this.parseAttributes(fileName);

        const scripts = [];
        for (const [scriptName, node] of esmScripts) {
            const members = [];
            for (const member of node.members) {
                if (member.kind === ts.SyntaxKind.PropertyDeclaration && !isStaticMember(member)) {
                    members.push(member);
                }
            }
            scripts.push({ scriptName, members });
            errors.push(...(attributes[scriptName]?.errors ?? []));
        }

        for (const { scriptName, members } of scripts) {
            const localMembers = [];
            for (const member of members) {
                const name = member.name.getText();
                const attribute = attributes[scriptName].attributes[name];
                const isAttribute = !!attribute;

                const type = getType(member, typeChecker);

                if (!SUPPORTED_ATTRIBUTE_TYPES.has(type.name)) {
                    continue;
                }

                const namePos = ts.getLineAndCharacterOfPosition(member.getSourceFile(), member.name.getStart());

                const jsdocNode = member.jsDoc && member.jsDoc[member.jsDoc.length - 1];
                const jsdocPos = jsdocNode ? ts.getLineAndCharacterOfPosition(member.getSourceFile(), jsdocNode.getStart()) : null;

                localMembers.push({
                    name,
                    isAttribute,
                    type: type.name + (type.array ? '[]' : ''),
                    start: jsdocNode ? { line: jsdocPos.line + 1, column: jsdocPos.character + 1 } :
                        { line: namePos.line + 1, column: namePos.character + 1 },
                    end: { line: namePos.line + 1, column: namePos.character + name.length + 1 }
                });
            }

            results[scriptName] = localMembers;
        }

        return [results, errors];
    }
}
