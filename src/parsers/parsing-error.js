/**
 * @typedef {Object} Fix
 * @property {string} text - The text to insert at the fix location
 * @property {string} title - The title of the fix
 * @property {{ startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number }} range - The range of the fix
 */

/**
 * A class representing a parsing error.
 * @param {import('typescript').Node} node - The AST node which caused the error
 * @param {string} type - The type of the error
 * @param {string} message - The description of the error
 * @param {Fix} [fix] - The fix for the error
 * @param {string} scriptName - The name of the script this error belongs to (required)
 * @param {string} [attributeName] - The name of the attribute this error belongs to (optional)
 */
export class ParsingError {
    constructor(node, type, message, fix, scriptName, attributeName) {
        this.node = node;        // AST node which caused the error
        this.type = type;        // Type of the error
        this.message = message;  // Description of the error
        this.fix = fix;          // Fix for the error
        this.scriptName = scriptName; // Script name context
        this.attributeName = attributeName; // Attribute name context (optional)
    }

    toString() {
        // Ensure node.location exists and has the necessary properties
        const file = this.node.getSourceFile();
        const fileName = file.fileName;
        const start = this.node.getSourceFile().getLineAndCharacterOfPosition(this.node.getStart());
        const location = `${fileName}:${start.line + 1}:${start.character}`;
        let context = '';
        if (this.scriptName && this.attributeName) {
            context = ` [${this.scriptName}.${this.attributeName}]`;
        } else if (this.scriptName) {
            context = ` [${this.scriptName}]`;
        } else if (this.attributeName) {
            context = ` [${this.attributeName}]`;
        }
        return `ParsingError: ${this.message}${context} at ${location}`;
    }
}
