import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('INVALID: Numeric attribute', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./numeric.invalid.js');
    });

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.not.be.empty;
        expect(data[1]).to.be.empty;
    });

    it('Example: should exist with attributes and errors (6)', function () {
        expect(data[0]?.example).to.exist;
        expect(data[0].example.attributes).to.not.be.empty;
        expect(data[0].example.errors.length).to.equal(6);
    });

    it('a: should fallback to a numeric attribute without range', function () {
        expect(data[0].example.attributes.a).to.exist;
        expect(data[0].example.attributes.a.name).to.equal('a');
        expect(data[0].example.attributes.a.type).to.equal('number');
        expect(data[0].example.attributes.a.array).to.equal(false);
        expect(data[0].example.attributes.a.default).to.equal(0);
        expect(data[0].example.attributes.a.min).to.not.exist;
        expect(data[0].example.attributes.a.max).to.not.exist;
    });

    it('b: should not be recognised as an attribute (step tag dropped)', function () {
        expect(data[0].example.attributes.b).to.not.exist;
    });

    it('c: should not be recognised as an attribute (precision tag dropped)', function () {
        expect(data[0].example.attributes.c).to.not.exist;
    });

    it('d: should fallback to a numeric attribute without step and precision', function () {
        expect(data[0].example.attributes.d).to.exist;
        expect(data[0].example.attributes.d.name).to.equal('d');
        expect(data[0].example.attributes.d.type).to.equal('number');
        expect(data[0].example.attributes.d.array).to.equal(false);
        expect(data[0].example.attributes.d.step).to.not.exist;
        expect(data[0].example.attributes.d.precision).to.not.exist;
    });

    it('e: should not be recognised as an attribute (step tag dropped)', function () {
        expect(data[0].example.attributes.e).to.exist;
        expect(data[0].example.attributes.e.step).to.not.exist;
    });
});
