import typescriptConfig from '@playcanvas/eslint-config/typescript';

export default [
    ...typescriptConfig,
    {
        ignores: ['types/**', 'test/fixtures/**']
    },
    {
        // chai assertions like expect(x).to.be.true are expression statements
        files: ['test/**/*.test.js'],
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off'
        }
    }
];
