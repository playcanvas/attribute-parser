import { parseNumber, parseStringToNumericalArray } from './ts-utils.js';

/**
 * Parses a tag value into a boolean, number, array or string
 * @param {string} input - The tag value to parse
 * @returns {boolean|number|string|Array<any>} - The parsed value
 */
export function parseTag(input = '') {

    // Remove any leading or trailing whitespace, replace single quotes with double quotes
    input = input.replace(/['`]/g, '"').trim();

    // Check for boolean
    if (input === 'true') return true;
    if (input === 'false') return false;

    // Check for number
    const num = parseNumber(input);
    if (!isNaN(num)) return num;

    // Check for numerical array
    try {
        const arr = parseStringToNumericalArray(input);
        if (Array.isArray(arr)) return arr;
    } catch (e) {}

    try {
        const arr = JSON.parse(input);
        if (Array.isArray(arr)) return arr;
    } catch (e) {}

    // If none of the above, return the string
    return input;
}

/**
 * Validates that a tag value matches the expected type
 * @throws {Error} - If the tag value is not the expected type
 *
 * @param {String} value - The string representation of the value to type check
 * @param {string} typeAnnotation - The expected type
 * @param {import('@typescript/vfs').VirtualTypeScriptEnvironment} env - The environment to validate in
 * @returns {boolean} - Whether the tag value is valid
 */
export function validateTag(value, typeAnnotation, env) {

    const sourceText = `let a: ${typeAnnotation} = ${value};`;
    env.createFile("/___virtual__.ts", sourceText);

    // Get the program and check for semantic errors
    const program = env.languageService.getProgram();
    const errors = program.getSemanticDiagnostics();

    // Filter against the type errors we're concerned with
    const typeErrors = errors.filter(error => error.category === 1 && error.code === 2322);

    // return first error
    const typeError = typeErrors[0];

    if (typeError) {
        throw new Error(`${typeError.messageText}`);
    }

    return true;
}
