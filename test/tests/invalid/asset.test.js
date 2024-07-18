/* eslint-disable no-unused-expressions */
import { describe, it, before } from 'mocha';
import { expect } from 'chai';

import { parseAttributes } from '../../utils.js';

describe('INVALID: Asset attribute', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./asset.invalid.js');
    });

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.not.be.empty;
        expect(data[1]).to.be.empty;
    });

    it('Example: should exist with errors (3)', function () {
        expect(data[0]?.example).to.exist;
        expect(data[0].example.attributes).to.not.be.empty;
        expect(data[0].example.errors.length).to.equal(3);
    });

    it('a: should fallback to an asset attribute without resource', function () {
        expect(data[0].example.attributes.a).to.exist;
        expect(data[0].example.attributes.a.name).to.equal('a');
        expect(data[0].example.attributes.a.type).to.equal('asset');
        expect(data[0].example.attributes.a.default).to.not.exist;
        expect(data[0].example.attributes.a.resource).to.not.exist;
    });

    it('b: should fallback to an asset attribute without resource', function () {
        expect(data[0].example.attributes.b).to.exist;
        expect(data[0].example.attributes.b.name).to.equal('b');
        expect(data[0].example.attributes.b.type).to.equal('asset');
        expect(data[0].example.attributes.b.default).to.not.exist;
        expect(data[0].example.attributes.b.resource).to.not.exist;
    });

    it('c: should fallback to an asset attribute without resource', function () {
        expect(data[0].example.attributes.c).to.exist;
        expect(data[0].example.attributes.c.name).to.equal('c');
        expect(data[0].example.attributes.c.type).to.equal('asset');
        expect(data[0].example.attributes.c.default).to.not.exist;
        expect(data[0].example.attributes.c.resource).to.not.exist;
    });
});
