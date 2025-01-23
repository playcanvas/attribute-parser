import playcanvasConfig from '@playcanvas/eslint-config';
import globals from 'globals';

export default [
    ...playcanvasConfig,
    {
        ignores: ['**/program.invalid.js'] // Exclude specific files
    },
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.mocha,
                ...globals.node
            }
        }
    },
    {
        rules: {
            'no-unused-expressions': 'off',
            'jsdoc/check-tag-names': 'off',
            'import/no-unresolved': 'off'
        }
    },
    {
        // Configuration specific to test files
        files: ['**/*.test.js'], // Match test files

        rules: {
            'prefer-arrow-callback': 'off' // Allow function expressions in test files
        }
    }
];
