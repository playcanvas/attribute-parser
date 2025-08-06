// eslint-disable-next-line
import { Script, Curve } from 'playcanvas';

class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     * @type {Curve}
     * @color bad
     */
    a;

    /**
     * @attribute
     * @type {Curve}
     * @color rgb
     * @curves ['x', 'y', 'z', 'w']
     */
    b;

    /**
     * @attribute
     * @type {Curve}
     * @color 1
     * @curves 1
     */
    c;
}

export { Example };
