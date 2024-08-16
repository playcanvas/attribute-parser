import { describe, it, before } from 'mocha';
import { expect } from 'chai';

import { parseAttributes } from '../../utils.js';

describe('VALID: Enum attribute', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./enum.valid.js');
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

    it('e: should be a enum attribute', function () {
        expect(data[0].example.attributes.e).to.exist;
        expect(data[0].example.attributes.e.name).to.equal('e');
        expect(data[0].example.attributes.e.type).to.equal('number');
        expect(data[0].example.attributes.e.array).to.equal(false);
        expect(data[0].example.attributes.e.default).to.equal(0);
    });

    it('f: should be a enum attribute with a default value', function () {
        expect(data[0].example.attributes.f).to.exist;
        expect(data[0].example.attributes.f.name).to.equal('f');
        expect(data[0].example.attributes.f.type).to.equal('number');
        expect(data[0].example.attributes.f.array).to.equal(false);
        expect(data[0].example.attributes.f.default).to.equal(1);
    });

    it('g: should be a enum attribute array with a size', function () {
        expect(data[0].example.attributes.g).to.exist;
        expect(data[0].example.attributes.g.name).to.equal('g');
        expect(data[0].example.attributes.g.type).to.equal('number');
        expect(data[0].example.attributes.g.array).to.equal(true);
        expect(data[0].example.attributes.g.size).to.equal(2);
        expect(data[0].example.attributes.g.default).equal(null);
    });

    it('h: should be a enum attribute', function () {
        expect(data[0].example.attributes.h).to.exist;
        expect(data[0].example.attributes.h.name).to.equal('h');
        expect(data[0].example.attributes.h.type).to.equal('string');
        expect(data[0].example.attributes.h.array).to.equal(false);
        expect(data[0].example.attributes.h.default).to.equal('');
    });

    it('i: should be a enum attribute with a default value', function () {
        expect(data[0].example.attributes.i).to.exist;
        expect(data[0].example.attributes.i.name).to.equal('i');
        expect(data[0].example.attributes.i.type).to.equal('vec3');
        expect(data[0].example.attributes.i.array).to.equal(false);
        expect(data[0].example.attributes.i.default).to.eql([0, 0, 0]);
    });

    it('j: should be a enum attribute array with a size', function () {
        expect(data[0].example.attributes.j).to.exist;
        expect(data[0].example.attributes.j.name).to.equal('j');
        expect(data[0].example.attributes.j.type).to.equal('number');
        expect(data[0].example.attributes.j.array).to.equal(false);
        expect(data[0].example.attributes.j.default).equal(2);
    });

});
