import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('INVALID: Program ', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./program.invalid.js');
    });

    it('only errors should exist (1)', function () {
        expect(data).to.exist;
        expect(data[0]).to.be.empty;
        expect(data[1].length).to.equal(4);
    });
});
