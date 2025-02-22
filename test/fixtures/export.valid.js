import { Script } from 'playcanvas';

import { ExampleImport } from './export.import.js';

class ExampleImportExtend extends ExampleImport {}

export { ExampleImport as ExampleImportAsExport } from './export.import.js';

class Example extends Script {
    /** @attribute */
    num = 10;
}

export default class ExampleDefault extends Script {}

export class ExampleExport extends Script {}

// eslint-disable-next-line
class ExampleNotExported extends Script {}

export {
    Example,
    Example as ExampleExportAs,
    ExampleImport,
    ExampleImportExtend
};
