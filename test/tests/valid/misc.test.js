import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('VALID: Misc attribute types', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./misc.valid.js');
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

    it('a: should be a numeric attribute with a title and description', function () {
        expect(data[0].example.attributes.a).to.exist;
        expect(data[0].example.attributes.a.name).to.equal('a');
        expect(data[0].example.attributes.a.type).to.equal('number');
        expect(data[0].example.attributes.a.array).to.equal(false);
        expect(data[0].example.attributes.a.default).to.equal(0);
        expect(data[0].example.attributes.a.title).to.equal('A number');
        expect(data[0].example.attributes.a.description).to.equal('This is a description of the attribute. It can be multi-sentence.\n\nAnd multi-line too');
    });

    it('b: should be a numeric attribute with a getter and setter', function () {
        expect(data[0].example.attributes.b).to.exist;
        expect(data[0].example.attributes.b.name).to.equal('b');
        expect(data[0].example.attributes.b.type).to.equal('number');
        expect(data[0].example.attributes.b.array).to.equal(false);
        expect(data[0].example.attributes.b.default).to.equal(0);
    });

    it('c: should not be recognised as an attribute (no attribute tag)', function () {
        expect(data[0].example.attributes.c).to.not.exist;
    });

    it('d: should be a numeric attribute with a getter and setter defined in reverse order', function () {
        expect(data[0].example.attributes.d).to.exist;
        expect(data[0].example.attributes.d.name).to.equal('d');
        expect(data[0].example.attributes.d.type).to.equal('number');
        expect(data[0].example.attributes.d.array).to.equal(false);
        expect(data[0].example.attributes.d.default).to.equal(0);
    });

});
