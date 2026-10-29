import { Script } from 'playcanvas';

class ExampleBase extends Script {
    static scriptName = null;

    /**
     * @attribute
     * @type {number}
     */
    a = 10;
}

class ExampleDerived extends ExampleBase {
    static scriptName = 'exampleDerived';

    /**
     * @attribute
     * @type {string}
     */
    b;
}

export { ExampleBase, ExampleDerived };
