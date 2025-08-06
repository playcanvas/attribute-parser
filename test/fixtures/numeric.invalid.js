import { Script } from 'playcanvas';

class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     * @range ['a', 'b']
     */
    a = 0;

    /**
     * @attribute
     * @step 0.1
     */
    b;

    /**
     * @attribute
     * @precision 2
     */
    c;

    /**
     * @attribute
     * @type {number}
     * @step a
     * @precision b
     */
    d;

    /**
     * @attribute
     * @type {number}
     * @step
     */
    e;
}

export { Example };
