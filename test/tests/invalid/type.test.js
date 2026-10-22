import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.ts';

describe('INVALID: Unsupported attribute types', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./type.invalid.js');
    });

    const errorFor = (name) => data[0].example.errors.find((e) => e.attributeName === name);

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.not.be.empty;
        expect(data[1]).to.be.empty;
    });

    it('Example: should exist with attributes and errors (7)', function () {
        expect(data[0].example).to.exist;
        expect(data[0].example.attributes).to.not.be.empty;
        expect(data[0].example.errors.length).to.equal(7);
    });

    for (const [name, desc] of [
        ['a', 'a single element tuple'],
        ['b', 'a tuple'],
        ['c', 'an empty object initializer'],
        ['d', 'an unresolved type'],
        ['e', 'an unresolved array type'],
        ['f', 'an empty type literal']
    ]) {
        it(`${name}: should report ${desc} as an invalid type`, function () {
            expect(data[0].example.attributes[name]).to.not.exist;
            expect(errorFor(name)?.message).to.include('is not a valid attribute type');
        });
    }

    it('g: should report an empty object interface member and keep the rest', function () {
        expect(errorFor('data')?.message).to.include('is not a valid attribute type');
        expect(data[0].example.attributes.g).to.exist;
        expect(data[0].example.attributes.g.type).to.equal('json');
        expect(data[0].example.attributes.g.schema.map((s) => s.name)).to.deep.equal(['hp']);
    });

    it('h: should still parse valid attributes', function () {
        expect(data[0].example.attributes.h).to.exist;
        expect(data[0].example.attributes.h.type).to.equal('number');
        expect(data[0].example.attributes.h.default).to.equal(1);
    });
});
