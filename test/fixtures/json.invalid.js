import { Script } from 'playcanvas';

class NoInterfaceFolder {
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
    /**
     * @attribute
     * @type {NoInterfaceFolder}
     */
    o;
}

export { Example };
