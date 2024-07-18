
import { Script } from 'playcanvas';

import { ExampleImport } from './export.import.js';

class ExampleImportExtend extends ExampleImport {};

export { ExampleImport as ExampleImportExportAs } from './export.import.js';

class Example extends Script {};

export default class ExampleDefault extends Script {};

export class ExampleExport extends Script {}

class ExampleNotExported extends Script {}

export {
    Example,
    Example as ExampleExportAs,
    ExampleImport,
    ExampleImportExtend
}