/* eslint-disable */
import { Script, Vec3 } from 'playcanvas';

/**
 * @interface
 */
class Folder {
    /**
     * @attribute
     * @type {number}
     */
    a;

    b = 10;
}

export class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     * @type {number}
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
