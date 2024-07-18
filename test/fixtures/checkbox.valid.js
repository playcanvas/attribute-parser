import { Script } from 'playcanvas';

class Example extends Script {
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
