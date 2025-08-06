// eslint-disable
import { Script } from 'playcanvas';

class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     * @type {string}
     */
    a;

    /**
     * @attribute
     */
    b = 'example';

    /**
     * @attribute
     * @type {string}
     * @placeholder Example text
     */
    c;

    /**
     * @attribute
     * @type {string[]}
     * @size 2
     */
    d;
}

export { Example };
