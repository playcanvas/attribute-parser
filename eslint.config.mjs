import javascriptConfig from '@playcanvas/eslint-config/javascript';
import prettierConfig from 'eslint-config-prettier/flat';
import globals from 'globals';

export default [
    ...javascriptConfig,
    {
        ignores: ['dist/**', 'types/**', 'test/fixtures/**']
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
        files: ['**/*.mjs'],
        languageOptions: {
            globals: {
                ...globals.node
            }
        },
        rules: {
            'import/no-named-as-default': 'off'
        }
    },
    {
        // Configuration specific to test files
        files: ['**/*.test.js'], // Match test files

        rules: {
            'prefer-arrow-callback': 'off' // Allow function expressions in test files
        }
    },
    prettierConfig
];
