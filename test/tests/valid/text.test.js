import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('VALID: Text attribute', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./text.valid.js');
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

    it('a: should be a string attribute', function () {
        expect(data[0].example.attributes.a).to.exist;
        expect(data[0].example.attributes.a.name).to.equal('a');
        expect(data[0].example.attributes.a.type).to.equal('string');
        expect(data[0].example.attributes.a.array).to.equal(false);
        expect(data[0].example.attributes.a.default).to.equal('');
    });

    it('b: should be a string attribute with a default value', function () {
        expect(data[0].example.attributes.b).to.exist;
        expect(data[0].example.attributes.b.name).to.equal('b');
        expect(data[0].example.attributes.b.type).to.equal('string');
        expect(data[0].example.attributes.b.array).to.equal(false);
        expect(data[0].example.attributes.b.default).to.equal('example');
    });

    it('c: should be a string attribute with a placeholder', function () {
        expect(data[0].example.attributes.c).to.exist;
        expect(data[0].example.attributes.c.name).to.equal('c');
        expect(data[0].example.attributes.c.type).to.equal('string');
        expect(data[0].example.attributes.c.array).to.equal(false);
        expect(data[0].example.attributes.c.default).to.equal('');
        expect(data[0].example.attributes.c.placeholder).to.equal('Example text');
    });

    it('d: should be a string attribute array with a size', function () {
        expect(data[0].example.attributes.d).to.exist;
        expect(data[0].example.attributes.d.name).to.equal('d');
        expect(data[0].example.attributes.d.type).to.equal('string');
        expect(data[0].example.attributes.d.array).to.equal(true);
        expect(data[0].example.attributes.d.size).to.equal(2);
        expect(data[0].example.attributes.d.default).equal(null);
    });

});
