/* eslint-disable no-unused-expressions */
import { describe, it, before } from 'mocha';
import { expect } from 'chai';

import { parseAttributes } from '../../utils.js';

describe('INVALID: Vector attribute', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./vector.invalid.js');
    });

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.not.be.empty;
        expect(data[1]).to.be.empty;
    });

    it('Example: should exist with errors (1)', function () {
        expect(data[0]?.example).to.exist;
        expect(data[0].example.attributes).to.be.empty;
        expect(data[0].example.errors.length).to.equal(1);
    });

    it('d: should not be recognized as an attribute (extends vector and not is vector)', function () {
        expect(data[0].example.attributes.d).to.not.exist;
    });

});
