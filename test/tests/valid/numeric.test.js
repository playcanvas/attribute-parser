import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('VALID: Numeric attribute', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./numeric.valid.js');
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

    it('a: should be a numeric attribute', function () {
        expect(data[0].example.attributes.a).to.exist;
        expect(data[0].example.attributes.a.name).to.equal('a');
        expect(data[0].example.attributes.a.type).to.equal('number');
        expect(data[0].example.attributes.a.array).to.equal(false);
        expect(data[0].example.attributes.a.default).to.equal(0);
    });

    it('b: should be a numeric attribute with a default value', function () {
        expect(data[0].example.attributes.b).to.exist;
        expect(data[0].example.attributes.b.name).to.equal('b');
        expect(data[0].example.attributes.b.type).to.equal('number');
        expect(data[0].example.attributes.b.array).to.equal(false);
        expect(data[0].example.attributes.b.default).to.equal(1);
    });

    it('c: should be a numeric attribute with a precision and step', function () {
        expect(data[0].example.attributes.c).to.exist;
        expect(data[0].example.attributes.c.name).to.equal('c');
        expect(data[0].example.attributes.c.type).to.equal('number');
        expect(data[0].example.attributes.c.array).to.equal(false);
        expect(data[0].example.attributes.c.default).to.equal(0);
        expect(data[0].example.attributes.c.precision).to.equal(2);
        expect(data[0].example.attributes.c.step).to.equal(0.01);
    });

    it('d: should be a numeric attribute with a range, precision and step', function () {
        expect(data[0].example.attributes.d).to.exist;
        expect(data[0].example.attributes.d.name).to.equal('d');
        expect(data[0].example.attributes.d.type).to.equal('number');
        expect(data[0].example.attributes.d.array).to.equal(false);
        expect(data[0].example.attributes.d.default).to.equal(0);
        expect(data[0].example.attributes.d.min).to.equal(0);
        expect(data[0].example.attributes.d.max).to.equal(1);
        expect(data[0].example.attributes.d.precision).to.equal(2);
        expect(data[0].example.attributes.d.step).to.equal(0.01);
    });

    it('e: should be a numeric attribute array with a size', function () {
        expect(data[0].example.attributes.e).to.exist;
        expect(data[0].example.attributes.e.name).to.equal('e');
        expect(data[0].example.attributes.e.type).to.equal('number');
        expect(data[0].example.attributes.e.array).to.equal(true);
        expect(data[0].example.attributes.e.size).to.equal(2);
        expect(data[0].example.attributes.e.default).equal(null);
    });

    it('f: should be a numeric attribute in an unusual format', function () {
        expect(data[0].example.attributes.f).to.exist;
        expect(data[0].example.attributes.f.name).to.equal('f');
        expect(data[0].example.attributes.f.type).to.equal('number');
        expect(data[0].example.attributes.f.array).to.equal(false);
        expect(data[0].example.attributes.f.default).to.equal(0);
        expect(data[0].example.attributes.f.min).to.equal(-255);
        expect(data[0].example.attributes.f.max).to.equal(0);
        expect(data[0].example.attributes.f.precision).to.equal(2);
        expect(data[0].example.attributes.f.step).to.equal(0.01);
    });

    it('g: should be a numeric attribute with single value in range', function () {
        expect(data[0].example.attributes.g).to.exist;
        expect(data[0].example.attributes.g.name).to.equal('g');
        expect(data[0].example.attributes.g.type).to.equal('number');
        expect(data[0].example.attributes.g.array).to.equal(false);
        expect(data[0].example.attributes.g.default).to.equal(0);
        expect(data[0].example.attributes.g.min).to.equal(1);
        expect(data[0].example.attributes.g.max).to.not.exist;
    });

    it('h: should be a numeric attribute with empty range', function () {
        expect(data[0].example.attributes.h).to.exist;
        expect(data[0].example.attributes.h.name).to.equal('h');
        expect(data[0].example.attributes.h.type).to.equal('number');
        expect(data[0].example.attributes.h.array).to.equal(false);
        expect(data[0].example.attributes.h.default).to.equal(0);
        expect(data[0].example.attributes.h.min).to.not.exist;
        expect(data[0].example.attributes.h.max).to.not.exist;
    });

    it('i: should be a numeric attribute with a range, precision and step', function () {
        expect(data[1]).to.be.empty;
        expect(data[0].example.attributes.i).to.exist;
        expect(data[0].example.attributes.i.name).to.equal('i');
        expect(data[0].example.attributes.i.type).to.equal('number');
        expect(data[0].example.attributes.i.array).to.equal(false);
        expect(data[0].example.attributes.i.default).to.equal(0);
        expect(data[0].example.attributes.i.min).to.equal(0);
        expect(data[0].example.attributes.i.max).to.equal(1);
    });
});
