import { getCombinedModifierFlags, ModifierFlags } from 'typescript';

/**
 * @file Utility functions for parsing Script attributes.
 */


/**
 * Returns a jsdoc tag from a JSDoc comment.
 * @param {string} tag - The tag to search for
 * @param {import('typescript').Node} doc - The JSDoc comment node
 * @returns {import('typescript').Node} | null} - The tag node
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

/**
 * Checks if a node is a scriptName property
 * @param {import('typescript').Node} member - The node to analyze
 * @returns {boolean} - True if the node is a scriptName property
 */
export const isStaticMember = member => (getCombinedModifierFlags(member) & ModifierFlags.Static) !== 0
