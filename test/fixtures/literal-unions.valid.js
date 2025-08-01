import { Script } from 'playcanvas';

class Example extends Script {
    /**
     * @attribute
     * @type {'a' | 'b' | 'c'}
     */
    stringUnion;

    /**
     * @attribute
     * @type {1 | 2 | 3}
     */
    numericUnion;

    /**
     * @attribute
     * @type {true | false}
     */
    booleanUnion;
}

export { Example };
