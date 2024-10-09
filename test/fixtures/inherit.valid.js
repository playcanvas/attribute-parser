import { Script } from 'playcanvas';

import { Example } from './example.dep.js';

class ExampleExtended extends Example {
    /**
     * @attribute
     * @type {number}
     */
    b;
}

class ExampleExtendedExtended extends ExampleExtended {
    /**
     * @attribute
     * @type {string}
     */
    c;
}

const ScriptAlias = Script;

class ExampleAlias extends ScriptAlias {
    /**
     * @attribute
     * @type {boolean}
     */
    a;
}

class ExampleNoExtend {
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
