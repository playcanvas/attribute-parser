import { Script } from 'playcanvas';

import { Example } from './example.dep.js';

class ExampleExtended extends Example {
    static scriptName = 'exampleExtended';

    /**
     * @attribute
     * @type {number}
     */
    b;
}

class ExampleExtendedExtended extends ExampleExtended {
    static scriptName = 'exampleExtendedExtended';

    /**
     * @attribute
     * @type {string}
     */
    c;
}

const ScriptAlias = Script;

class ExampleAlias extends ScriptAlias {
    static scriptName = 'exampleAlias';

    /**
     * @attribute
     * @type {boolean}
     */
    a;
}

class ExampleNoExtend {
    static scriptName = 'exampleNoExtend';

    /**
     * @attribute
     * @type {number}
     */
    a;
}

export {
    Example,
    ExampleExtended,
    ExampleExtendedExtended,
    ExampleAlias,
    ExampleNoExtend
};
