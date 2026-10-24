import { expect } from 'chai';
import { describe, it, before } from 'mocha';

import { getAttributes, parseAttributes } from '../../utils.ts';

describe('VALID: Members whose names are not identifiers', function () {
    describe('parseAttributes', function () {
        let data;
        before(async function () {
            data = await parseAttributes('./member-names.valid.js');
        });

        it('parses without errors', function () {
            expect(data[1]).to.be.empty;
            expect(data[0]?.example).to.exist;
            expect(data[0].example.errors).to.be.empty;
        });

        it('keeps the attributes with identifier names', function () {
            expect(Object.keys(data[0].example.attributes)).to.have.members(['speed', 'settings']);
            expect(data[0].example.attributes.speed.type).to.equal('number');
        });

        it('skips a private member of an interface type', function () {
            const schema = data[0].example.attributes.settings.schema;
            expect(schema.map(({ name }) => name)).to.deep.equal(['level']);
        });
    });

    describe('getAttributes', function () {
        let data;
        before(async function () {
            data = await getAttributes('./member-names.valid.js');
        });

        it('parses without errors', function () {
            expect(data[1]).to.be.empty;
            expect(data[0]?.example).to.exist;
        });

        it('lists only the members with identifier names', function () {
            const names = data[0].example.map(({ name }) => name);
            expect(names).to.not.include.members(['#secret', '#taggedSecret', "['computed']", "'quoted'", '42']);
        });
    });
});
