import { Script, Curve } from 'playcanvas';

class Example extends Script {
    /**
     * @attribute
     * @type {Curve}
     */
    a;

    /**
     * @attribute
     */
    b = new Curve([
        0, 0,
        1, 1
    ]);

    /**
     * @attribute
     * @type {Curve}
     * @color r
     */
    c;

    /**
     * @attribute
     * @type {Curve}
     * @color rgb
     * @curves ['x', 'y', 'z']
     */
    d;

    /**
     * @attribute
     * @type {Curve[]}
     * @size 2
     */
    e;

    /**
     * @attribute
     * @type {Curve}
     * @color rgba
     * @curves ["x", 'y', `z`]
     */
    f;
}

export { Example };
