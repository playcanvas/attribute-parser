import { describe, it, before } from 'mocha';
import { expect } from 'chai';

import { parseAttributes } from '../../utils.js';

describe('VALID: Vector attribute', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./vector.valid.js');
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

    it('a: should be a vector attribute', function () {
        expect(data[0].example.attributes.a).to.exist;
        expect(data[0].example.attributes.a.name).to.equal('a');
        expect(data[0].example.attributes.a.type).to.equal('vec2');
        expect(data[0].example.attributes.a.array).to.equal(false);
        expect(data[0].example.attributes.a.default).to.eql([0, 0]);
    });

    it('b: should be a vector attribute with a default value', function () {
        expect(data[0].example.attributes.b).to.exist;
        expect(data[0].example.attributes.b.name).to.equal('b');
        expect(data[0].example.attributes.b.type).to.equal('vec3');
        expect(data[0].example.attributes.b.array).to.equal(false);
        expect(data[0].example.attributes.b.default).to.eql([1, 2, 3]);
    });

    it('c: should be a vector attribute array with a size', function () {
        expect(data[0].example.attributes.c).to.exist;
        expect(data[0].example.attributes.c.name).to.equal('c');
        expect(data[0].example.attributes.c.type).to.equal('vec4');
        expect(data[0].example.attributes.c.array).to.equal(true);
        expect(data[0].example.attributes.c.size).to.equal(2);
        expect(data[0].example.attributes.c.default).equal(null);
    });

    it('d: should not be recognized as an attribute (extends vector and not is vector)', function () {
        expect(data[0].example.attributes.d).to.not.exist;
    });

});
