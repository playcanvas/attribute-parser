import fs from 'fs';

import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import swc from '@rollup/plugin-swc';
import { knownLibFilesForCompilerOptions } from '@typescript/vfs';
import ts from 'typescript';

const production = process.env.NODE_ENV === 'production';

// Concatenates the TypeScript compiler options into a single file
const types = knownLibFilesForCompilerOptions({ target: ts.ScriptTarget.ES2023 }, ts).reduce((acc, file) => {
    const src = fs.readFileSync(`node_modules/typescript/lib/${file}`, 'utf8');
    return `${acc}// ${file}\n${src}\n\n`;
}, '');
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/libs.d.ts', types);

const swcPlugin = () => swc({
    swc: {
        minify: production,
        env: {
            loose: true
        }
    }
});

// Browser build: bundles typescript and @typescript/vfs and stubs out node built-ins,
// for in-browser consumers (e.g. the editor), which supply lib types via a CDN.
const browser = {
    input: 'src/index.js',
    output: {
        dir: 'dist',
        format: 'esm'
    },
    plugins: [
        commonjs({
            include: /node_modules/,
            ignoreGlobal: true,
            sourceMap: false
        }),
        resolve({
            browser: true, // This instructs the plugin to resolve for the browser
            preferBuiltins: false // Prefer the local versions of built-ins instead of Node.js versions
        }),
        swcPlugin()
    ]
};

// Node build: keep typescript and @typescript/vfs external so they load as real node modules
// (real os/fs/path and a native require). The browser build stubs these out, which breaks
// createDefaultMapFromNodeModules and TypeScript's getNodeSystem() under node.
const node = {
    input: 'src/index.js',
    external: [/^node:/, 'typescript', '@typescript/vfs'],
    output: {
        dir: 'dist',
        entryFileNames: 'index.node.mjs',
        format: 'esm'
    },
    plugins: [
        resolve({
            exportConditions: ['node'],
            preferBuiltins: true
        }),
        swcPlugin()
    ]
};

export default [browser, node];
