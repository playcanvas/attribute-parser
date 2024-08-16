/**
 * @file Utility functions for parsing Script attributes.
 */


/**
 * Returns a tsdoc tag from a JSDoc comment.
 * @param {string} tag - The tag to search for
 * @param {import('typescript').Node} doc - The JSDoc comment node
 * @returns {import('@microsoft/tsdoc').DocNode | null} - The tag node
 */
export const getTagFromJsdoc = (tag, doc) => {
    return doc?.tags?.find(doc => doc.tagName.text === tag);
};

/**
 * Checks if a node has a specific JSDoc tag.
 * @param {string} tag - The tag to search for
 * @param {import("typescript").Node} node - The node to analyze
 * @returns {import('typescript').Node} - True if the tag is found
 */
export const getTag = (tag, node) => {
    return node?.jsDoc?.find(doc => getTagFromJsdoc(tag, doc));
};

/**
 * Checks if a node has a specific JSDoc tag.
 * @param {string} tag - The tag to search for
 * @param {import("typescript").Node} node - The node to analyze
 * @returns {boolean} - True if the tag is found
 */
export const hasTag = (tag, node) => {
    return !!getTag(tag, node);
};


/**
 * Checks if the JSDoc node node has an '@interface' tag
 * @param {import('typescript').Node} node - The node to analyze
 * @returns {boolean} - True if the node is an interface
 */
export const isInterface = (node) => {
    return hasTag('interface', node);
};

// /**
//  * Parses a type tag in the format "{type}".
//  * @param {import('@microsoft/tsdoc').DocSection} content - The content of the tag.
//  * @param {object} metadata - An object to store the extracted metadata.
//  * @param {{ node: import('typescript').Node, env: tsdoc.Environment, errors: string[] }} opts - Additional parser options
//  * @returns {{ type: import('typescript').Type | null, array: boolean | null }} - The extracted type and array flag.
//  */
// export function parseTypeTag(content, metadata, { node, env, errors }) {

//     // Extract the full source text of the original file
//     const originalSourceText = node.getSourceFile().getFullText();
//     const typeString = extractTextFromDocNode(content);
//     const sourceText = `${originalSourceText}\nlet a: ${typeString};`;

//     env.createFile("/virtual.ts", sourceText);

//     const updatedProgram = env.languageService.getProgram();
//     const newTypeChecker = updatedProgram.getTypeChecker();

//     const sourceFile = updatedProgram.getSourceFile('/virtual.ts');

//     const variableStatement = sourceFile.statements[sourceFile.statements.length - 1];
//     const variableDeclaration = variableStatement.declarationList.declarations[0];
//     return getType(variableDeclaration, newTypeChecker);
// }
