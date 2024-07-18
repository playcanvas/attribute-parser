import { Script } from 'playcanvas';

class Example extends Script {
    /**
     * @attribute
     * @type {number}
     */
    a;

    /**
     * @attribute
     */
    b = 1;

    /**
     * @attribute
     * @type {number}
     * @precision 2
     * @step 0.01
     */
    c;

    /**
     * @attribute
     * @type {number}
     * @range [0, 1]
     * @precision 2
     * @step 0.01
     */
    d;

    /**
     * @attribute
     * @type {number[]}
     * @size 2
     */
    e;

    /**
     * @attribute
     * @type {number}
     * @range [       -  0xFF, 0o0        ]
     * @precision 0b10
     * @step 1e-2
     */
    f;

    /**
     * @attribute
     * @type {number}
     * @range [1]
     */
    g;

    /**
     * @attribute
     * @type {number}
     * @range []
     */
    h;
}

export { Example };
