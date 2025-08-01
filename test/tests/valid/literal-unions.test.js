import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('VALID: Literal union types', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./literal-unions.valid.js');
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

    it('stringUnion: should be a string attribute from literal union', function () {
        expect(data[0].example.attributes.stringUnion).to.exist;
        expect(data[0].example.attributes.stringUnion.name).to.equal('stringUnion');
        expect(data[0].example.attributes.stringUnion.type).to.equal('string');
        expect(data[0].example.attributes.stringUnion.array).to.equal(false);
    });

    it('numericUnion: should be a number attribute from literal union', function () {
        expect(data[0].example.attributes.numericUnion).to.exist;
        expect(data[0].example.attributes.numericUnion.name).to.equal('numericUnion');
        expect(data[0].example.attributes.numericUnion.type).to.equal('number');
        expect(data[0].example.attributes.numericUnion.array).to.equal(false);
    });

    it('booleanUnion: should be a boolean attribute from literal union', function () {
        expect(data[0].example.attributes.booleanUnion).to.exist;
        expect(data[0].example.attributes.booleanUnion.name).to.equal('booleanUnion');
        expect(data[0].example.attributes.booleanUnion.type).to.equal('boolean');
        expect(data[0].example.attributes.booleanUnion.array).to.equal(false);
    });
});
