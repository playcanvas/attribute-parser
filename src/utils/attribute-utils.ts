import type { Declaration, Node } from 'typescript';
import { getCombinedModifierFlags, ModifierFlags } from 'typescript';

import type { InternalNode } from './ts-utils.ts';

/**
 * @file Utility functions for parsing Script attributes.
 */

/**
 * Returns a JSDoc tag from a node if it exists
 * @param tag - The tag to search for
 * @param node - The node to analyze
 * @returns The tag node or null if not found
 */
export const getTag = (tag: string, node: Node) => {
    for (const jsDoc of (node as InternalNode).jsDoc || []) {
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
 * @param tag - The tag to search for
 * @param node - The node to analyze
 * @returns True if the tag is found
 */
export const hasTag = (tag: string, node: Node) => {
    return !!getTag(tag, node);
};

/**
 * Checks if the JSDoc node node has an '@interface' tag
 * @param node - The node to analyze
 * @returns True if the node is an interface
 */
export const isInterface = (node: Node) => {
    return hasTag('interface', node);
};

/**
 * Checks if a node is a scriptName property
 * @param member - The node to analyze
 * @returns True if the node is a scriptName property
 */
export const isStaticMember = (member: Declaration) => (getCombinedModifierFlags(member) & ModifierFlags.Static) !== 0;
