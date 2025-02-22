import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('VALID: Conditional Tags', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./conditional.valid.js');
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

    it('a: should conditional `@visibleif` tag', function () {
        expect(data[0].example.attributes.a).exist;
        expect(data[0].example.attributes.a.name).to.equal('a');
        expect(data[0].example.attributes.a.type).to.equal('number');
        expect(data[0].example.attributes.a.visibleif).to.equal('b === 2');
    });

    it('b: should conditional `@enabledif` tag', function () {
        expect(data[0].example.attributes.b).exist;
        expect(data[0].example.attributes.b.name).to.equal('b');
        expect(data[0].example.attributes.b.type).to.equal('number');
        expect(data[0].example.attributes.b.enabledif).to.equal('a === 3');
    });

    it('c: should not include `@enabledif` or `@visibleif` tag if none is declared', function () {
        expect(data[0].example.attributes.c).exist;
        expect(data[0].example.attributes.c.name).to.equal('c');
        expect(data[0].example.attributes.c.type).to.equal('number');
        expect(data[0].example.attributes.c.enabledif).to.not.exist;
        expect(data[0].example.attributes.c.visibleif).to.not.exist;
    });
});
