/* eslint-disable no-unused-expressions */
import { describe, it, before } from 'mocha';
import { expect } from 'chai';

import { parseAttributes } from '../../utils.js';

describe('INVALID: Curve attribute', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./curve.invalid.js');
    });

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.not.be.empty;
        expect(data[1]).to.be.empty;
    });

    it('Example: should exist with errors (4)', function () {
        expect(data[0]?.example).to.exist;
        expect(data[0].example.attributes).to.not.be.empty;
        expect(data[0].example.errors.length).to.equal(4);
    });
});
