import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

function runTests(fileName) {

    const isTS = fileName.endsWith('.ts');
    const script = isTS ? 'TS' : 'JS';

    describe(`${script}: VALID: Checkbox attribute`, function () {
        let data;
        before(async function () {
            data = await parseAttributes(fileName);
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

        it('a: should be a checkbox attribute', function () {
            expect(data[0].example.attributes.a).to.exist;
            expect(data[0].example.attributes.a.name).to.equal('a');
            expect(data[0].example.attributes.a.type).to.equal('boolean');
            expect(data[0].example.attributes.a.array).to.equal(false);
            expect(data[0].example.attributes.a.default).to.equal(false);
        });

        it('b: should be a checkbox attribute with a default value', function () {
            expect(data[0].example.attributes.b).to.exist;
            expect(data[0].example.attributes.b.name).to.equal('b');
            expect(data[0].example.attributes.b.type).to.equal('boolean');
            expect(data[0].example.attributes.b.array).to.equal(false);
            expect(data[0].example.attributes.b.default).to.equal(true);
        });

        it('c: should be a checkbox attribute array with a size', function () {
            expect(data[0].example.attributes.c).to.exist;
            expect(data[0].example.attributes.c.name).to.equal('c');
            expect(data[0].example.attributes.c.type).to.equal('boolean');
            expect(data[0].example.attributes.c.array).to.equal(true);
            expect(data[0].example.attributes.c.size).to.equal(2);
            expect(data[0].example.attributes.c.default).equal(null);
        });

    });
}

runTests('./checkbox.valid.js');
