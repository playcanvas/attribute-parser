import typescriptConfig from '@playcanvas/eslint-config/typescript';
import globals from 'globals';

export default [
    ...typescriptConfig,
    {
        ignores: ['dist/**', 'types/**', 'test/fixtures/**']
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.mocha,
                ...globals.node
            }
        }
    },
    {
        // chai assertions like expect(x).to.be.true are expression statements
        files: ['test/**/*.test.js'],
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off'
        }
    }
];
