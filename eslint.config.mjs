import typescriptConfig from '@playcanvas/eslint-config/typescript';

export default [
    ...typescriptConfig,
    {
        ignores: ['types/**', 'test/fixtures/**']
    }
];
