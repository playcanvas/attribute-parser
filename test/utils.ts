import fs from 'fs/promises';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import { JSDocParser } from '../src/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Reads the contents of a file and returns an array containing the file name and its contents.
 * @param filePath - The path to the file.
 * @returns A promise that resolves to an array containing the file name and its contents.
 */
async function getFileData(filePath: string): Promise<[string, string]> {
    try {
        const contents = await fs.readFile(path.join(__dirname, 'fixtures', filePath), 'utf8');
        return [path.join('/', filePath), contents];
    } catch (error) {
        console.error(`Error reading file ${filePath}: ${error}`);
        return [path.basename(filePath), null]; // Return null for contents if there was an error
    }
}

/**
 * Loads the playcanvas types file from node_modules.
 * @returns A promise that resolves to an array containing the file path and its contents.
 */
async function getPlaycanvasTypes(): Promise<[string, string]> {
    const typesUrl = import.meta.resolve('playcanvas/build/playcanvas.d.ts');
    const typesPath = fileURLToPath(typesUrl);
    const contents = await fs.readFile(typesPath, 'utf8');
    // Use /playcanvas.d.ts as the virtual file system path to match what the code expects
    return ['/playcanvas.d.ts', contents];
}

/**
 * Fetches the contents of multiple files.
 * @param filePaths - An array of file paths.
 * @returns A promise that resolves to an array containing the file names and their contents.
 */
export function fetchScripts(filePaths: string[]) {
    return Promise.all(filePaths.map(getFileData));
}

/**
 * Parses the attributes of the given example files.
 * @param paths - The paths to the example files.
 * @returns A promise that resolves to the extracted attributes and errors.
 */
export async function parseAttributes(...paths: string[]) {
    const parser = new JSDocParser();
    await parser.init();
    const scriptContents = await fetchScripts(paths);
    const playcanvasTypes = await getPlaycanvasTypes();
    parser.updateProgram([...scriptContents, playcanvasTypes]);
    return parser.parseAttributes(paths[0]);
}

/**
 * Gets the attribute members of the given example files.
 * @param paths - The paths to the example files.
 * @returns A promise that resolves to the extracted members and errors.
 */
export async function getAttributes(...paths: string[]) {
    const parser = new JSDocParser();
    await parser.init();
    const scriptContents = await fetchScripts(paths);
    const playcanvasTypes = await getPlaycanvasTypes();
    parser.updateProgram([...scriptContents, playcanvasTypes]);
    return parser.getAttributes(paths[0]);
}
