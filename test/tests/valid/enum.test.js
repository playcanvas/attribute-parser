import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { BODYGROUP_DEFAULT } from 'playcanvas';

import { parseAttributes } from '../../utils.js';

function runTests(fileName) {

    const isTS = fileName.endsWith('.ts');
    const script = isTS ? 'TS' : 'JS';

    describe(`${script}: VALID: Enum attribute`, function () {
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
            expect(data[0].example.errors).to.be.empty;
            expect(data[0].example.attributes).to.not.be.empty;
        });

        it('e: should be a enum attribute', function () {
            expect(data[0].example.attributes.e).to.exist;
            expect(data[0].example.attributes.e.name).to.equal('e');
            expect(data[0].example.attributes.e.type).to.equal('number');
            expect(data[0].example.attributes.e.array).to.equal(false);
            expect(data[0].example.attributes.e.default).to.equal(13);
        });

        it('f: should be a enum attribute with a default value', function () {
            expect(data[0].example.attributes.f).to.exist;
            expect(data[0].example.attributes.f.name).to.equal('f');
            expect(data[0].example.attributes.f.type).to.equal('number');
            expect(data[0].example.attributes.f.array).to.equal(false);
            expect(data[0].example.attributes.f.default).to.equal(1);
        });

        it('g: should be a enum attribute array with a size', function () {
            expect(data[0].example.attributes.g).to.exist;
            expect(data[0].example.attributes.g.name).to.equal('g');
            expect(data[0].example.attributes.g.type).to.equal('number');
            expect(data[0].example.attributes.g.array).to.equal(true);
            expect(data[0].example.attributes.g.size).to.equal(2);
            expect(data[0].example.attributes.g.default).equal(null);
        });

        it('h: should be a enum attribute', function () {
            expect(data[0].example.attributes.h).to.exist;
            expect(data[0].example.attributes.h.name).to.equal('h');
            expect(data[0].example.attributes.h.type).to.equal('string');
            expect(data[0].example.attributes.h.array).to.equal(false);
            expect(data[0].example.attributes.h.enum).to.be.an('array').with.lengthOf(4);
            expect(data[0].example.attributes.h.enum[0]).to.deep.equal({ A: 'a' });
            expect(data[0].example.attributes.h.enum[1]).to.deep.equal({ B: 'b' });
            expect(data[0].example.attributes.h.enum[2]).to.deep.equal({ C: 'c' });
            expect(data[0].example.attributes.h.enum[3]).to.deep.equal({ 'A string key': 'd' });
            expect(data[0].example.attributes.h.default).to.equal('');
        });

        it('j: should be a enum attribute with imported constant', function () {
            expect(data[0].example.attributes.j).to.exist;
            expect(data[0].example.attributes.j.name).to.equal('j');
            expect(data[0].example.attributes.j.type).to.equal('number');
            expect(data[0].example.attributes.j.array).to.equal(false);
            expect(data[0].example.attributes.j.enum).to.be.an('array').with.lengthOf(1);
            expect(data[0].example.attributes.j.enum[0]).to.deep.equal({ A: BODYGROUP_DEFAULT }); // BODYGROUP_DEFAULT should resolve to its actual value
            expect(data[0].example.attributes.j.default).to.equal(BODYGROUP_DEFAULT); // BODYGROUP_DEFAULT should resolve to its actual value
        });

    });
}

runTests('./enum.valid.js');
runTests('./enum.valid.ts');
