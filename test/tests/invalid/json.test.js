import { describe, it, before } from 'mocha';
import { expect } from 'chai';

import { parseAttributes } from '../../utils.js';

describe('INVALID: JSON attribute', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./json.invalid.js');
    });

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.not.be.empty;
        expect(data[1]).to.be.empty;
    });

    it('Example: should exist with errors (1)', function () {
        expect(data[0]?.example).to.exist;
        expect(data[0].example.attributes).to.be.empty;
        expect(data[0].example.errors.length).to.equal(1);
    });

    it('o: should not be recognised as an attribute (type not an interface)', function () {
        expect(data[0].example.attributes.o).to.not.exist;
    });
});
