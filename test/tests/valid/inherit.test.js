import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('VALID: Script inheritance attributes', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./inherit.valid.js', './example.dep.js');
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

    it('ExampleExtended: should exist without errors', function () {
        expect(data[0]?.exampleExtended).to.exist;
        expect(data[0].exampleExtended.attributes).to.not.be.empty;
        expect(data[0].exampleExtended.attributes.a).to.exist;
        expect(data[0].exampleExtended.attributes.a.type).to.equal('boolean');
        expect(data[0].exampleExtended.attributes.a.array).to.equal(false);
        expect(data[0].exampleExtended.attributes.a.default).to.equal(false);
        expect(data[0].exampleExtended.attributes.b).to.be.exists;
        expect(data[0].exampleExtended.attributes.b.type).to.equal('number');
        expect(data[0].exampleExtended.attributes.b.array).to.equal(false);
        expect(data[0].exampleExtended.attributes.b.default).to.equal(0);
        expect(data[0].exampleExtended.errors).to.be.empty;
    });

    it('ExampleExtendedExtended: should exist without errors', function () {
        expect(data[0]?.exampleExtendedExtended).to.exist;
        expect(data[0].exampleExtendedExtended.attributes).to.not.be.empty;
        expect(data[0].exampleExtendedExtended.errors).to.be.empty;
    });

    it('ExampleAlias: should exist without errors', function () {
        expect(data[0]?.exampleAlias).to.exist;
        expect(data[0].exampleAlias.attributes).to.not.be.empty;
        expect(data[0].exampleAlias.errors).to.be.empty;
    });

    it('Example#a: should be a checkbox attribute', function () {
        expect(data[0].example.attributes.a).to.exist;
        expect(data[0].example.attributes.a.name).to.equal('a');
        expect(data[0].example.attributes.a.type).to.equal('boolean');
        expect(data[0].example.attributes.a.array).to.equal(false);
        expect(data[0].example.attributes.a.default).to.equal(false);
    });

    it('ExampleExtended#a: should be a checkbox attribute', function () {
        expect(data[0].exampleExtended.attributes.a).to.exist;
        expect(data[0].exampleExtended.attributes.a.name).to.equal('a');
        expect(data[0].exampleExtended.attributes.a.type).to.equal('boolean');
        expect(data[0].exampleExtended.attributes.a.array).to.equal(false);
        expect(data[0].exampleExtended.attributes.a.default).to.equal(false);
    });

    it('ExampleExtended#b: should be a numeric attribute', function () {
        expect(data[0].exampleExtended.attributes.b).to.exist;
        expect(data[0].exampleExtended.attributes.b.name).to.equal('b');
        expect(data[0].exampleExtended.attributes.b.type).to.equal('number');
        expect(data[0].exampleExtended.attributes.b.array).to.equal(false);
        expect(data[0].exampleExtended.attributes.b.default).to.equal(0);
    });

    it('ExampleExtendedExtended#a: should be a checkbox attribute', function () {
        expect(data[0].exampleExtendedExtended.attributes.a).to.exist;
        expect(data[0].exampleExtendedExtended.attributes.a.name).to.equal('a');
        expect(data[0].exampleExtendedExtended.attributes.a.type).to.equal('boolean');
        expect(data[0].exampleExtendedExtended.attributes.a.array).to.equal(false);
        expect(data[0].exampleExtendedExtended.attributes.a.default).to.equal(false);
    });

    it('ExampleExtendedExtended#b: should be a numeric attribute', function () {
        expect(data[0].exampleExtendedExtended.attributes.b).to.exist;
        expect(data[0].exampleExtendedExtended.attributes.b.name).to.equal('b');
        expect(data[0].exampleExtendedExtended.attributes.b.type).to.equal('number');
        expect(data[0].exampleExtendedExtended.attributes.b.array).to.equal(false);
        expect(data[0].exampleExtendedExtended.attributes.b.default).to.equal(0);
    });

    it('ExampleExtendedExtended#c: should be a string attribute', function () {
        expect(data[0].exampleExtendedExtended.attributes.c).to.exist;
        expect(data[0].exampleExtendedExtended.attributes.c.name).to.equal('c');
        expect(data[0].exampleExtendedExtended.attributes.c.type).to.equal('string');
        expect(data[0].exampleExtendedExtended.attributes.c.array).to.equal(false);
        expect(data[0].exampleExtendedExtended.attributes.c.default).to.equal('');
    });

    it('ExampleAlias#a: should be a checkbox attribute', function () {
        expect(data[0].exampleAlias.attributes.a).to.exist;
        expect(data[0].exampleAlias.attributes.a.name).to.equal('a');
        expect(data[0].exampleAlias.attributes.a.type).to.equal('boolean');
        expect(data[0].exampleAlias.attributes.a.array).to.equal(false);
        expect(data[0].exampleAlias.attributes.a.default).to.equal(false);
    });

    it('ExampleNoExtend: should not exist (does not extend Script)', function () {
        expect(data[0].exampleNoExtend).to.not.exist;
    });

});
