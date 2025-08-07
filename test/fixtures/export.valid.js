import { Script } from 'playcanvas';

import { ExampleImport } from './export.import.js';

class ExampleImportExtend extends ExampleImport {
    static scriptName = 'exampleImportExtend';
}

export { ExampleImport as ExampleImportAsExport } from './export.import.js';

class Example extends Script {
    /** @attribute */
    num = 10;
}

export default class ExampleDefault extends Script {
    static scriptName = 'exampleDefault';
}

export class ExampleExport extends Script {
    static scriptName = 'exampleExport';
}

// eslint-disable-next-line
class ExampleNotExported extends Script {
    static scriptName = 'exampleNotExported';
}

export {
    Example,
    Example as ExampleExportAs,
    ExampleImport,
    ExampleImportExtend
};
