import { describe, it, before } from 'mocha';
import { expect } from 'chai';

import { parseAttributes } from '../../utils.js';

describe('VALID: Color attribute', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./color.valid.js');
    });

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.not.be.empty;
        expect(data[1]).to.be.empty;
    });

    it('Example: should exist without errors', function () {
        expect(data[0]?.example).to.exist;
        expect(data[0].example.attributes).to.not.be.empty;
        expect(data[0].example.errors).to.be.empty;
    });

    it('a: should be a color attribute', function () {
        expect(data[0].example.attributes.a).to.exist;
        expect(data[0].example.attributes.a.name).to.equal('a');
        expect(data[0].example.attributes.a.type).to.equal('rgba');
        expect(data[0].example.attributes.a.array).to.equal(false);
        expect(data[0].example.attributes.a.default).to.eql([1, 1, 1, 1]);
    });

    it('b: should be a color attribute with a default value', function () {
        expect(data[0].example.attributes.b).to.exist;
        expect(data[0].example.attributes.b.name).to.equal('b');
        expect(data[0].example.attributes.b.type).to.equal('rgba');
        expect(data[0].example.attributes.b.array).to.equal(false);
        expect(data[0].example.attributes.b.default).to.eql([1, 0, 0, 1]);
    });

    it('c: should be a color attribute array with a size', function () {
        expect(data[0].example.attributes.c).to.exist;
        expect(data[0].example.attributes.c.name).to.equal('c');
        expect(data[0].example.attributes.c.type).to.equal('rgba');
        expect(data[0].example.attributes.c.array).to.equal(true);
        expect(data[0].example.attributes.c.size).to.equal(2);
        expect(data[0].example.attributes.c.default).equal(null);
    });

});
