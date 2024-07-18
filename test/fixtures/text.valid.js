import { Script } from 'playcanvas';

class Example extends Script {
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
