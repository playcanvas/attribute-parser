import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { JSDocParser } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Reads the contents of a file and returns an array containing the file name and its contents.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<[string, string]>} A promise that resolves to an array containing the file name and its contents.
 */
async function getFileData(filePath) {
    try {
        const contents = await fs.readFile(path.join(__dirname, 'fixtures', filePath), 'utf8');
        return [path.join('/', filePath), contents];
    } catch (error) {
        console.error(`Error reading file ${filePath}: ${error}`);
        return [path.basename(filePath), null]; // Return null for contents if there was an error
    }
}

/**
 * Fetches the contents of multiple files.
 * @param {string[]} filePaths - An array of file paths.
 * @returns {Promise<[string, string][]>} A promise that resolves to an array containing the file names and their contents.
 */
export function fetchScripts(filePaths) {
    return Promise.all(filePaths.map(getFileData));
}

/**
 * @param {string[]} paths - The path to the example file.
 * @returns {Promise<[results: any,
 * errors: import('../src/parsers/script-parser.js').ValidationError[]]>} A promise that resolves to
 * an array of attribute data.
 */
export async function parseAttributes(...paths) {
    const parser = new JSDocParser();
    await parser.init();
    const scriptContents = await fetchScripts([...paths, './playcanvas.d.ts']);
    return parser.parseAttributes(paths[0], scriptContents);
}

export async function getAttributes(...paths) {
    const parser = new JSDocParser();
    await parser.init();
    const scriptContents = await fetchScripts([...paths, './playcanvas.d.ts']);
    return parser.getAttributes(paths[0], scriptContents);
}
