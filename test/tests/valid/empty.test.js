import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('VALID: Program ', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./empty.valid.js');
    });

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.be.empty;
        expect(data[1]).to.be.empty;
    });
});
