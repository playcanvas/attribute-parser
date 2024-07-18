/* eslint-disable */
import { Script, Vec3 } from 'playcanvas';

/**
 * @interface
 */
class Folder {
    /**
     * @attribute
     */
    a;

    b = 10;
}

export class Example extends Script {
    /**
     * @attribute
     */
    a;

    b = 10;

    c = true;

    d = 'hello';

    e = {};

    f = new Vec3();

    /**
     * @attribute
     * @type {Folder}
     */
    g;
}
