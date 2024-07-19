import ts from 'typescript';
import { createSystem, createDefaultMapFromNodeModules, createVirtualTypeScriptEnvironment } from '@typescript/vfs';

import { ScriptParser } from './parsers/script-parser.js';
import { createDefaultMapFromCDN, flatMapAnyNodes, getExportedNodes, getType, inheritsFrom, isAliasedClassDeclaration } from './utils/ts-utils.js';

const toLowerCamelCase = str => str[0].toLowerCase() + str.substring(1);

const COMPILER_OPTIONS = {
    strictPropertyInitialization: false, // Allow uninitialized properties
    target: ts.ScriptTarget.ES2022, // If this version changes, the types must be updated in the /rollup.config.mjs
    module: ts.ModuleKind.CommonJS,
    checkJs: true, // Enable JSDoc parsing
    allowJs: true,
    noImplicitAny: false, // Allow implicit any
    baseUrl: './',
    paths: {
        "playcanvas": ["/playcanvas.js"]
    }
};

export class JSDocParser {
    /**
     * @type {import('@typescript/vfs').VirtualTypeScriptEnvironment}
     * @private
     */
    _env;

    async init(basePath = '') {
        if (this._env) {
            return;
        }

        let fsMap;
        if (basePath) {
            fsMap = await createDefaultMapFromCDN({ target: ts.ScriptTarget.ES2022 }, basePath, ts);
        } else {
            fsMap = await createDefaultMapFromNodeModules(COMPILER_OPTIONS, ts);
        }

        // Set up the virtual file system and environment
        const system = createSystem(fsMap);
        this._env = createVirtualTypeScriptEnvironment(system, Array.from(fsMap.keys()), ts, COMPILER_OPTIONS);
    }

    /**
     * Creates program from fileName and scriptsContents
     *
     * @param {[string, string][]} newFiles - An array of {[path]: [content]} which represent the files in the program
     * @param {string[]} removedFiles - An array of file paths that should be removed from the program
     * @returns {{ parser: ScriptParser, program: ts.Program,
     * errors: import('./parsers/script-parser.js').ValidationError[]}} - The extracted attributes
     * @private
     */
    _updateProgram(newFiles = [], removedFiles = []) {
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


        const parser = new ScriptParser(this._env);
        const program = this._env.languageService.getProgram();

        // Check for compiler errors
        parser.validateProgram(errors);

        return {
            parser,
            program,
            errors
        };
    }

    /**
     * Determines if a module contains a script that inherits from `pc.Script`
     * @param {[string, string][]} files - An array of {[path]: [content]} pairs which represent the files in the program
     * @returns 
     */
    exportsEsmScript(files) {

        const [fileName] = files;
        
        const { program, errors } = this._updateProgram(files);
        if (errors.length) {
            return false;
        }

        const typeChecker = program.getTypeChecker();

        // Find the Script class in the PlayCanvas namespace
        const pcTypes = program.getSourceFile('/playcanvas.d.ts');


        if (!sourceFile) {
            throw new Error(`PlayCanvas Types must be supplied`);
        }

        const esmScriptClass = pcTypes.statements.find(node => node.kind === ts.SyntaxKind.ClassDeclaration && node.name.text === 'Script')?.symbol;

        // Parse the source file and pc types
        const sourceFile = program.getSourceFile(fileName);

        if (!sourceFile) {
            throw new Error(`Source file ${fileName} not found`);
        }

        // Extract all exported nodes
        const nodes = getExportedNodes(program, sourceFile);

        // Check if the file exports a class that inherits from `Script`
        return nodes.some(node => isAliasedClassDeclaration(node, typeChecker) && inheritsFrom(node, typeChecker, esmScriptClass));

    }

    /**
     * Analyzes the specified TypeScript file and extracts metadata from JSDoc comments.
     *
     * @param {string} fileName - The name of the file to run
     * @param {[string, string][]} newFiles - An array of {[path]: [content]} which represent the files in the program
     * @param {string[]} removedFiles - An array of file paths that should be removed from the program
     * @returns {[results: object, errors: import('./parsers/script-parser.js').ValidationError[]]} - The extracted attributes
     */
    parseAttributes(fileName, newFiles = [], removedFiles = []) {
        const results = {};

        const { parser, program, errors } = this._updateProgram(newFiles, removedFiles);
        if (errors.length) {
            return [results, errors];
        }

        const typeChecker = program.getTypeChecker();

        // Find the Script class in the PlayCanvas namespace
        const pcTypes = program.getSourceFile('/playcanvas.d.ts');
        const esmScriptClass = pcTypes.statements.find(node => node.kind === ts.SyntaxKind.ClassDeclaration && node.name.text === 'Script')?.symbol;

        // Parse the source file and pc types
        const sourceFile = program.getSourceFile(fileName);

        if (!sourceFile) {
            throw new Error(`Source file ${fileName} not found`);
        }

        // Extract all exported nodes
        const nodes = getExportedNodes(program, sourceFile);

        // Extract attributes from each script
        nodes.forEach((node) => {
            if (!isAliasedClassDeclaration(node, typeChecker) || !inheritsFrom(node, typeChecker, esmScriptClass)) return;
            const name = toLowerCamelCase(node.name.text);
            const opts = results[name] = { attributes: {}, errors: [] };
            parser.extractAttributes(node, opts);
        });

        return [results, errors];
    }

    /**
     * Analyzes the specified TypeScript file and extracts metadata from JSDoc comments.
     * @param {string} fileName - The name of the file to run
     * @param {[string, string][]} newFiles - An array of {[path]: [content]} which represent the files in the program
     * @param {string[]} removedFiles - An array of file paths for files that should be removed from the program
     * @returns {[results: object, errors: import('./parsers/script-parser.js').ValidationError[]]} - The extracted attributes
     */
    getAttributes(fileName, newFiles = [], removedFiles = []) {
        const results = {};

        const { program, errors } = this._updateProgram(newFiles, removedFiles);
        if (errors.length) {
            return [results, errors];
        }

        const typeChecker = program.getTypeChecker();

        // Find the Script class in the PlayCanvas namespace
        const pcTypes = program.getSourceFile('/playcanvas.d.ts');
        const esmScriptClass = pcTypes.statements.find(node => node.kind === ts.SyntaxKind.ClassDeclaration && node.name.text === 'Script')?.symbol;

        // Parse the source file and pc types
        const sourceFile = program.getSourceFile(fileName);

        if (!sourceFile) {
            throw new Error(`Source file ${fileName} not found`);
        }

        // Filter out classes that do not inherit from `Script` or are interfaces
        const isInterface = node => node.jsDoc.some(jsdoc => jsdoc.tags?.some(tag => tag.tagName.getText() === 'interface'));

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
                if (member.kind !== ts.SyntaxKind.PropertyDeclaration) {
                    continue;
                }

                // Extract JSDoc tags
                const tags = member.jsDoc.map(jsdoc => jsdoc.tags?.map(tag => tag.tagName.getText()) ?? []).flat();

                const name = member.name.getText();
                const type = getType(member, typeChecker);
                if (!type) {
                    continue;
                }

                const namePos = ts.getLineAndCharacterOfPosition(member.getSourceFile(), member.name.getStart());

                const jsdocNode = member.jsDoc[member.jsDoc.length - 1];
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
