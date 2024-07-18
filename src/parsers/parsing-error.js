export class ParsingError {
    constructor(node, message) {
        this.node = node;        // AST node which caused the error
        this.message = message;  // Description of the error
    }

    toString() {
        // Ensure node.location exists and has the necessary properties
        const file = this.node.getSourceFile();
        const fileName = file.fileName;
        const start = this.node.getSourceFile().getLineAndCharacterOfPosition(this.node.getStart());
        return `ParsingError: ${this.message} at ${fileName}:${start.line + 1}:${start.character}`;
    }
}
