import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { getAttributes } from '../../utils.js';

describe('VALID: Intellisense Parsing', function () {

    let data;
    before(async function () {
        data = await getAttributes('./intellisense.valid.js');
    });

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.not.be.empty;
        expect(data[1]).to.be.empty;
    });

    it('Example: should exist', function () {
        expect(data[0]?.example).to.exist;
    });

    it('does not return static members', function () {
        expect(data[0].example[0].name).to.not.equal('scriptName');
    });

    it('attributes have correct types', function () {
        expect(data[0].folder[0].type).to.equal('any');
        expect(data[0].folder[1].type).to.equal('number');

        expect(data[0].example[0].type).to.equal('any');
        expect(data[0].example[1].type).to.equal('number');
        expect(data[0].example[2].type).to.equal('boolean');
        expect(data[0].example[3].type).to.equal('string');
        expect(data[0].example[4].type).to.equal('{}');
        expect(data[0].example[5].type).to.equal('Vec3');
        expect(data[0].example[6].type).to.equal('Folder');
    });
});
