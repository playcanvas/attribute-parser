import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('INVALID: Mixed literal union types', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./literal-unions.invalid.js');
    });

    it('should have errors for mixed literal unions', function () {
        expect(data).to.exist;
        expect(data[0].example).to.exist;
        expect(data[1]).to.be.empty;
        expect(data[0].example.errors).to.not.be.empty; // errors array should not be empty
    });

    it('mixedLiteralUnion: should raise an error for mixed literal union', function () {
        const errors = data[0].example.errors;
        const mixedUnionError = errors.find(error => error.node.name.escapedText === 'mixedLiteralUnion');
        expect(mixedUnionError).to.exist;
    });

    it('mixedStringNumberBoolean: should raise an error for mixed string/number/boolean union', function () {
        const errors = data[0].example.errors;
        const mixedUnionError = errors.find(error => error.node.name.escapedText === 'mixedStringNumberBoolean');
        expect(mixedUnionError).to.exist;
    });

    it('mixedPrimitiveTypes: should raise an error for mixed primitive types union', function () {
        const errors = data[0].example.errors;
        const mixedUnionError = errors.find(error => error.node.name.escapedText === 'mixedPrimitiveTypes');
        expect(mixedUnionError).to.exist;
    });
});
