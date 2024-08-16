import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('INVALID: Misc attribute types', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./misc.invalid.js');
    });

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.not.be.empty;
        expect(data[1]).to.be.empty;
    });

    it('Example: should exist with attributes and errors (4)', function () {
        expect(data[0].example).to.exist;
        expect(data[0].example.attributes).to.not.be.empty;
        expect(data[0].example.errors.length).to.equal(3);
    });

    it('e: should not be recognised as an attribute (cannot infer GraphNode type)', function () {
        expect(data[0].example.attributes.e).to.not.exist;
    });

    it('f: should not be recognised as an attribute (cannot infer custom Vec3 type)', function () {
        expect(data[0].example.attributes.f).to.not.exist;
    });

    it('g: should fallback to a numeric attribute array without size', function () {
        expect(data[0].example.attributes.g).to.exist;
        expect(data[0].example.attributes.g.name).to.equal('g');
        expect(data[0].example.attributes.g.type).to.equal('number');
        expect(data[0].example.attributes.g.array).to.equal(true);
        expect(data[0].example.attributes.g.default).to.not.exist;
        expect(data[0].example.attributes.g.size).to.not.exist;
    });

});
