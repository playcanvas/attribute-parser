import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('VALID: Curve attribute', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./curve.valid.js');
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

    it('a: should be a curve attribute', function () {
        expect(data[0].example.attributes.a).exist;
        expect(data[0].example.attributes.a.name).to.equal('a');
        expect(data[0].example.attributes.a.type).to.equal('curve');
        expect(data[0].example.attributes.a.array).to.equal(false);
        expect(data[0].example.attributes.a.default).to.not.exist;
    });

    it('b: should be a curve attribute with a default value', function () {
        expect(data[0].example.attributes.b).exist;
        expect(data[0].example.attributes.b.name).to.equal('b');
        expect(data[0].example.attributes.b.type).to.equal('curve');
        expect(data[0].example.attributes.b.array).to.equal(false);
        expect(data[0].example.attributes.b.default).to.eql([0, 0, 1, 1]);
    });

    it('c: should be a curve attribute with a color', function () {
        expect(data[0].example.attributes.c).exist;
        expect(data[0].example.attributes.c.name).to.equal('c');
        expect(data[0].example.attributes.c.type).to.equal('curve');
        expect(data[0].example.attributes.c.array).to.equal(false);
        expect(data[0].example.attributes.a.default).to.not.exist;
        expect(data[0].example.attributes.c.color).to.equal('r');
    });

    it('d: should be a curve attribute with a color and curve', function () {
        expect(data[0].example.attributes.d).exist;
        expect(data[0].example.attributes.d.name).to.equal('d');
        expect(data[0].example.attributes.d.type).to.equal('curve');
        expect(data[0].example.attributes.d.array).to.equal(false);
        expect(data[0].example.attributes.a.default).to.not.exist;
        expect(data[0].example.attributes.d.color).to.equal('rgb');
        expect(data[0].example.attributes.d.curves).to.deep.equal(['x', 'y', 'z']);
    });

    it('e: should be a curve attribute array with a size', function () {
        expect(data[0].example.attributes.e).exist;
        expect(data[0].example.attributes.e.name).to.equal('e');
        expect(data[0].example.attributes.e.type).to.equal('curve');
        expect(data[0].example.attributes.e.array).to.equal(true);
        expect(data[0].example.attributes.e.size).to.equal(2);
        expect(data[0].example.attributes.e.default).to.not.exist;
    });

    it('f: should be a curve attribute in an unsual format', function () {
        expect(data[0].example.attributes.f).exist;
        expect(data[0].example.attributes.f.name).to.equal('f');
        expect(data[0].example.attributes.f.type).to.equal('curve');
        expect(data[0].example.attributes.f.array).to.equal(false);
        expect(data[0].example.attributes.f.color).to.equal('rgba');
        expect(data[0].example.attributes.f.curves).to.deep.equal(['x', 'y', 'z']);
    });
});
