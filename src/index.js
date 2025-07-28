import { createSystem, createDefaultMapFromNodeModules, createVirtualTypeScriptEnvironment } from '@typescript/vfs';
import * as ts from 'typescript';

import { ScriptParser } from './parsers/script-parser.js';
import { isInterface, isStaticMember } from './utils/attribute-utils.js';
import { createDefaultMapFromCDN, flatMapAnyNodes, getExportedNodes, getType, inheritsFrom, isAliasedClassDeclaration } from './utils/ts-utils.js';

const toLowerCamelCase = str => str[0].toLowerCase() + str.substring(1);

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
     * @returns {Map<string, import('typescript').Node>} - A map of valid ESM Script <names, nodes> within the file
     */
    getAllEsmScripts(fileName) {

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
                if (scriptNameMember) {
                    name = scriptNameMember.initializer.text;
                } else {
                    // Otherwise, convert the class name to lower camel case
                    name = toLowerCamelCase(name);
                }

                esmScripts.set(name, node);
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
        const nodes = this.getAllEsmScripts(fileName);

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

        // Find the Script class in the PlayCanvas namespace
        const pcTypes = this.program.getSourceFile('/playcanvas.d.ts');
        const esmScriptClass = pcTypes.statements.find(node => node.kind === ts.SyntaxKind.ClassDeclaration && node.name.text === 'Script')?.symbol;

        // Parse the source file and pc types
        const sourceFile = this.program.getSourceFile(fileName);

        if (!sourceFile) {
            throw new Error(`Source file ${fileName} not found`);
        }

        const nodes = flatMapAnyNodes(sourceFile, (node) => {
            if (!ts.isClassDeclaration(node)) {
                return false;
            }

            return inheritsFrom(node, typeChecker, esmScriptClass) || isInterface(node);
        });

        for (const node of nodes) {
            const name = toLowerCamelCase(node.name.text);
            const members = [];

            for (const member of node.members) {
                if (member.kind !== ts.SyntaxKind.PropertyDeclaration || isStaticMember(member)) {
                    continue;
                }

                // Extract JSDoc tags
                const tags = member.jsDoc ? member.jsDoc.map(jsdoc => jsdoc.tags?.map(tag => tag.tagName.getText()) ?? []).flat() : [];

                const name = member.name.getText();
                const type = getType(member, typeChecker);
                if (!type) {
                    continue;
                }

                const namePos = ts.getLineAndCharacterOfPosition(member.getSourceFile(), member.name.getStart());

                const jsdocNode = member.jsDoc && member.jsDoc[member.jsDoc.length - 1];
                const jsdocPos = jsdocNode ? ts.getLineAndCharacterOfPosition(member.getSourceFile(), jsdocNode.getStart()) : null;

                const data = {
                    name,
                    type: type.name + (type.array ? '[]' : ''),
                    isAttribute: tags.includes('attribute'),
                    start: jsdocNode ? { line: jsdocPos.line + 1, column: jsdocPos.character + 1 } :
                        { line: namePos.line + 1, column: namePos.character + 1 },
                    end: { line: namePos.line + 1, column: namePos.character + name.length + 1 }
                };

                members.push(data);
            }

            results[name] = members;
        }

        return [results, errors];
    }
}
