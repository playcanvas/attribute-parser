import { DiagnosticCategory } from 'typescript';

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
    } catch { }

    try {
        const arr = JSON.parse(input);
        if (Array.isArray(arr)) return arr;
    } catch { }

    // If none of the above, return the string
    return input;
}

/**
 * Validates that a tag value matches the expected type
 *
 * @param {String} value - The value to be validated.
 * @param {String} typeAnnotation - The TypeScript type annotation as a string.
 * @param {import('@typescript/vfs').VirtualTypeScriptEnvironment} env - The environment containing the language service and file creation utilities.
 * @throws Will throw an error if the value does not conform to the typeAnnotation.
 * @returns {true} if validation passes without type errors.
 */
export function validateTag(value, typeAnnotation, env) {
    const virtualFileName = '/___virtual__.ts';
    const sourceText = `let a: ${typeAnnotation} = ${value};`;

    // Create or overwrite the virtual file with the new source text
    env.createFile(virtualFileName, sourceText);

    // Retrieve the language service from the environment
    const languageService = env.languageService;

    // Fetch semantic diagnostics only for the virtual file
    const errors = languageService.getSemanticDiagnostics(virtualFileName);

    // Filter for type assignment errors (Error Code 2322: Type 'X' is not assignable to type 'Y')
    const typeErrors = errors.filter(
        error => error.code === 2322 && error.category === DiagnosticCategory.Error
    );

    // If any type error is found, throw an error with the diagnostic message
    if (typeErrors.length > 0) {
        const errorMessage = typeErrors[0].messageText.toString();
        throw new Error(`Type Validation Error: ${errorMessage}`);
    }

    // If no type errors are found, return true indicating successful validation
    return true;
}
