import { getCombinedModifierFlags, ModifierFlags } from 'typescript';

/**
 * @file Utility functions for parsing Script attributes.
 */

/**
 * Returns a JSDoc tag from a node if it exists
 * @param {string} tag - The tag to search for
 * @param {import("typescript").Node} node - The node to analyze
 * @returns {import("typescript").JSDocTag | null} - The tag node or null if not found
 */
export const getTag = (tag, node) => {
    for (const jsDoc of node?.jsDoc || []) {
        for (const tagNode of jsDoc.tags || []) {
            if (tagNode.tagName.text === tag) {
                return tagNode;
            }
        }
    }
    return null;
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
export const isStaticMember = member => (getCombinedModifierFlags(member) & ModifierFlags.Static) !== 0;
