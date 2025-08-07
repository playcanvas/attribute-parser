import { Script } from 'playcanvas';

// eslint-disable-next-line
class NoInterfaceFolder {
    static scriptName = 'example';
    /**
     * @attribute
     * @type {boolean}
     */
    a;
}

/**
 * @interface
 */
class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     * @type {NoInterfaceFolder}
     */
    o;
}

export { Example };
