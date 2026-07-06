import type { Node } from 'typescript';

export type Fix = {
    /** The text to insert at the fix location */
    text: string;
    /** The title of the fix */
    title: string;
    /** The range of the fix */
    range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
};

/**
 * A class representing a parsing error.
 */
export class ParsingError {
    /** The AST node which caused the error */
    node: Node;

    /** The type of the error */
    type: string;

    /** The description of the error */
    message: string;

    /** The fix for the error */
    fix?: Fix;

    /** The name of the script this error belongs to */
    scriptName?: string;

    /** The name of the attribute this error belongs to */
    attributeName?: string;

    constructor(node: Node, type: string, message: string, fix?: Fix, scriptName?: string, attributeName?: string) {
        this.node = node; // AST node which caused the error
        this.type = type; // Type of the error
        this.message = message; // Description of the error
        this.fix = fix; // Fix for the error
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
