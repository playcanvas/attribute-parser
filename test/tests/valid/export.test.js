import { describe, it, before } from 'mocha';
import { expect } from 'chai';

import { parseAttributes } from '../../utils.js';

describe('VALID: Export Script', function () {
    let data;
    before(async function () {
        data = await parseAttributes('./export.valid.js', './export.import.js');
    });

    it('only results should exist', function () {
        expect(data).to.exist;
        expect(data[0]).to.not.be.empty;
        expect(data[1]).to.be.empty;
    });

    it('Example: should exist without attributes or errors', function () {
        expect(data[0]?.example).to.exist;
        expect(data[0].example.attributes).to.be.empty;
        expect(data[0].example.errors).to.be.empty;
    });

    it('ExampleExport: should exist without attributes or errors', function () {
        expect(data[0]?.exampleExport).to.exist;
        expect(data[0].exampleExport.attributes).to.be.empty;
        expect(data[0].exampleExport.errors).to.be.empty;
    });

    it('ExampleDefault: should exist without attributes or errors', function () {
        expect(data[0]?.exampleDefault).to.exist;
        expect(data[0].exampleDefault.attributes).to.be.empty;
        expect(data[0].exampleDefault.errors).to.be.empty;
    });

    it('ExampleExportAs: should not exist', function () {
        expect(data[0]?.exampleExportAs).to.not.exist;
    });

    it('ExampleImport: should exist without attributes or errors', function () {
        expect(data[0]?.exampleImport).to.exist;
        expect(data[0].exampleImport.attributes).to.be.empty;
        expect(data[0].exampleImport.errors).to.be.empty;
    });

    it('ExampleImportExtend: should exist without attributes or errors', function () {
        expect(data[0]?.exampleImportExtend).to.exist;
        expect(data[0].exampleImportExtend.attributes).to.be.empty;
        expect(data[0].exampleImportExtend.errors).to.be.empty;
    });

    it('ExampleNotExported: should not exist (not exported)', function () {
        expect(data[0]?.exampleNotExported).to.not.exist;
    });
});
