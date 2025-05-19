import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { parseAttributes } from '../../utils.js';

describe('VALID: Program ', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./program.valid.js');
    });

    it('should have a customExample script', function () {
        expect(data[0].customExample).to.exist;
        expect(data[0].customExample.errors).to.be.empty;
    });

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.not.be.empty;
        expect(data[1]).to.be.empty;
        expect(data[0].customExample.errors).to.be.empty;
    });
});
