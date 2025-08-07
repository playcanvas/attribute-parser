import { Script } from 'playcanvas';

class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     * @type {boolean}
     */
    a;

    /**
     * @attribute
     */
    b = true;

    /**
     * @attribute
     * @type {boolean[]}
     * @size 2
     */
    c;
}

export { Example };
