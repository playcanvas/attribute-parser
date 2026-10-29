import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.ts';

describe('VALID: Script base class with a null scriptName', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./base-class.valid.js');
    });

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.not.be.empty;
        expect(data[1]).to.be.empty;
    });

    it('ExampleBase: should not exist, and not warn about its name', function () {
        expect(data[0]?.exampleBase).to.not.exist;
        expect(Object.keys(data[0])).to.deep.equal(['exampleDerived']);
    });

    it('ExampleDerived: should exist with its own and the inherited attributes', function () {
        expect(data[0]?.exampleDerived).to.exist;
        expect(data[0].exampleDerived.attributes.a).to.exist;
        expect(data[0].exampleDerived.attributes.a.type).to.equal('number');
        expect(data[0].exampleDerived.attributes.a.default).to.equal(10);
        expect(data[0].exampleDerived.attributes.b).to.exist;
        expect(data[0].exampleDerived.attributes.b.type).to.equal('string');
        expect(data[0].exampleDerived.errors).to.be.empty;
    });
});
