import { Script, Vec3 } from 'playcanvas';

// eslint-disable-next-line
class Vec3Extended extends Vec3 {};

class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     * @type {Vec3Extended}
     */
    d;
}

export { Example };
