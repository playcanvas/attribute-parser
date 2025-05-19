import { Script, Vec3 } from 'playcanvas';

/**
 * @interface
 */
// eslint-disable-next-line
class Folder {
    /**
     * This is some description of the attribute.
     * @attribute
     * @type {boolean}
     */
    a;

    /**
     * @attribute
     * @range [10, 20]
     */
    b = 10;

    c = 'hello';

    /**
     * @attribute
     * @type {Vec3[]}
     */
    d;
}

/**
 * @interface
 *
 */
// eslint-disable-next-line
class NestedFolder {
    /**
     * @attribute
     * @type {Folder}
     */
    x;
}

/**
 * @interface
 */
class Example extends Script {
    /**
     * @attribute
     * @type {Folder}
     */
    f;

    /**
     * @attribute
     * @type {Folder[]}
     * @size 2
     */
    g;

    /**
     * @attribute
     * @type {NestedFolder}
     */
    h;

    /**
     * @attribute
     */
    i = {
        /** description of a */
        a: true,
        /** @range [10, 20] */
        b: 10,
        c: 'hello',
        d: [new Vec3(1, 2, 3)]
    };

    /**
     * @typedef {object} TypeDefFolder
     * @property {number} x - The x component
     * @property {number} y - The y component
     */

    /**
     * @attribute
     * @type {TypeDefFolder}
     */
    j;

    /**
     * @typedef {{ x: number, y: number }} InlineTypeDefFolder
     */

    /**
     * @attribute
     * @type {InlineTypeDefFolder}
     */
    k;

    /**
     * @attribute
     * @type {{ x: number, y: number }}
     */
    l;

    /**
     * @attribute
     * @type {Example}
     */
    m;

    n = 10;
}

export { Example };
