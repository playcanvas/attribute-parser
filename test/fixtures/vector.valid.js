// eslint-disable-next-line
import { Script, Vec2, Vec3, Vec4 } from 'playcanvas';

class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     * @type {Vec2}
     */
    a;

    /**
     * @attribute
     */
    b = new Vec3(1, 2, 3);

    /**
     * @attribute
     * @type {Vec4[]}
     * @size 2
     */
    c;
}

export { Example };
