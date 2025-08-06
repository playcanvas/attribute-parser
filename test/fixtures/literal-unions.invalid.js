import { Script } from 'playcanvas';

class Example extends Script {
    static scriptName = 'example';

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
