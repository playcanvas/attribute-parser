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

export default {
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
        production &&
            swc({
                swc: {
                    minify: true,
                    jsc: {
                        minify: {
                            compress: true,
                            mangle: true
                        }
                    }
                }
            })
    ]
};
