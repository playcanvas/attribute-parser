import { Script } from 'playcanvas';

class Example extends Script {
    /**
     * @attribute
     * @type {1 | 'one' | true}
     */
    mixedLiteralUnion;

    /**
     * @attribute
     * @type {'a' | 1 | false}
     */
    mixedStringNumberBoolean;

    /**
     * @attribute
     * @type {string | number | boolean}
     */
    mixedPrimitiveTypes;
}

export { Example };
