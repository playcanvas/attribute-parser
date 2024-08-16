import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('VALID: JSON attribute', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./json.valid.js');
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

    it('f: should be a json attribute', function () {
        expect(data[0].example.attributes.f).to.exist;
        expect(data[0].example.attributes.f.name).to.equal('f');
        expect(data[0].example.attributes.f.type).to.equal('json');
        expect(data[0].example.attributes.f.array).to.equal(false);
        expect(data[0].example.attributes.f.default).to.equal(null);

        expect(data[0].example.attributes.f.schema).to.exist;
    });

    it('f[a]: should be a boolean attribute', function () {
        expect(data[0].example.attributes.f.schema[0].name).to.equal('a');
        expect(data[0].example.attributes.f.schema[0].type).to.equal('boolean');
        expect(data[0].example.attributes.f.schema[0].array).to.equal(false);
        expect(data[0].example.attributes.f.schema[0].default).to.equal(false);
    });

    it('f[b]: should be a numeric attribute', function () {
        expect(data[0].example.attributes.f.schema[1].name).to.equal('b');
        expect(data[0].example.attributes.f.schema[1].type).to.equal('number');
        expect(data[0].example.attributes.f.schema[1].array).to.equal(false);
        expect(data[0].example.attributes.f.schema[1].default).to.equal(10);
    });

    it('f[c]: should be a string attribute', function () {
        expect(data[0].example.attributes.f.schema[2].name).to.equal('c');
        expect(data[0].example.attributes.f.schema[2].type).to.equal('string');
        expect(data[0].example.attributes.f.schema[2].array).to.equal(false);
        expect(data[0].example.attributes.f.schema[2].default).to.equal('hello');
    });

    it('f[d]: should be a vec3 attribute array', function () {
        expect(data[0].example.attributes.f.schema[3].name).to.equal('d');
        expect(data[0].example.attributes.f.schema[3].type).to.equal('vec3');
        expect(data[0].example.attributes.f.schema[3].array).to.equal(true);
        expect(data[0].example.attributes.f.schema[3].default).to.eql(null);
    });

    it('g: should be a json attribute array with a size', function () {
        expect(data[0].example.attributes.g).to.exist;
        expect(data[0].example.attributes.g.name).to.equal('g');
        expect(data[0].example.attributes.g.type).to.equal('json');
        expect(data[0].example.attributes.g.array).to.equal(true);
        expect(data[0].example.attributes.g.size).to.equal(2);
        expect(data[0].example.attributes.g.default).to.eql(null);

        expect(data[0].example.attributes.g.schema).to.exist;
    });

    it('h: should be a nested json attribute (parent)', function () {
        expect(data[0].example.attributes.h).to.exist;
        expect(data[0].example.attributes.h.name).to.equal('h');
        expect(data[0].example.attributes.h.type).to.equal('json');
        expect(data[0].example.attributes.h.array).to.equal(false);
        expect(data[0].example.attributes.h.default).to.eql(null);

        expect(data[0].example.attributes.h.schema).to.exist;
    });

    it('h[x]: should be a nested json attribute (child)', function () {
        expect(data[0].example.attributes.h.schema[0].name).to.equal('x');
        expect(data[0].example.attributes.h.schema[0].type).to.equal('json');
        expect(data[0].example.attributes.h.schema[0].array).to.equal(false);
        expect(data[0].example.attributes.h.schema[0].default).to.eql(null);

        expect(data[0].example.attributes.h.schema[0].schema).to.exist;
    });

    it('i: should be an inline default json attribute', function () {
        expect(data[0].example.attributes.i).to.exist;
        expect(data[0].example.attributes.i.name).to.equal('i');
        expect(data[0].example.attributes.i.type).to.equal('json');
        expect(data[0].example.attributes.i.array).to.equal(false);
        expect(data[0].example.attributes.i.default).to.eql(null);

        expect(data[0].example.attributes.i.schema).to.exist;
    });

    it('j: should be a typedef json attribute', function () {
        expect(data[0].example.attributes.j).to.exist;
        expect(data[0].example.attributes.j.name).to.equal('j');
        expect(data[0].example.attributes.j.type).to.equal('json');
        expect(data[0].example.attributes.j.array).to.equal(false);
        expect(data[0].example.attributes.j.default).to.eql(null);

        expect(data[0].example.attributes.j.schema).to.exist;
    });

    it('k: should be an inline typedef json attribute', function () {
        expect(data[0].example.attributes.k).to.exist;
        expect(data[0].example.attributes.k.name).to.equal('k');
        expect(data[0].example.attributes.k.type).to.equal('json');
        expect(data[0].example.attributes.k.array).to.equal(false);
        expect(data[0].example.attributes.k.default).to.eql(null);

        expect(data[0].example.attributes.k.schema).to.exist;
    });

    it('l: should be an inline type json attribute', function () {
        expect(data[0].example.attributes.l).to.exist;
        expect(data[0].example.attributes.l.name).to.equal('l');
        expect(data[0].example.attributes.l.type).to.equal('json');
        expect(data[0].example.attributes.l.array).to.equal(false);
        expect(data[0].example.attributes.l.default).to.eql(null);

        expect(data[0].example.attributes.l.schema).to.exist;
    });

    it('m: should be a self reference json attribute', function () {
        expect(data[0].example.attributes.m).to.exist;
        expect(data[0].example.attributes.m.name).to.equal('m');
        expect(data[0].example.attributes.m.type).to.equal('json');
        expect(data[0].example.attributes.m.array).to.equal(false);
        expect(data[0].example.attributes.m.default).to.eql(null);

        expect(data[0].example.attributes.m.schema).to.exist;
    });

    it('n: should not be recognised as an attribute (no attribute tag)', function () {
        expect(data[0].example.attributes.n).to.not.exist;
    });

    it('o: should not be recognised as an attribute (type not an interface)', function () {
        expect(data[0].example.attributes.o).to.not.exist;
    });
});
