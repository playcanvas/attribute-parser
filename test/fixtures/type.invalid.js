import { Script } from 'playcanvas';

/** @interface */
class Enemy {
    /** some data */
    data = {};

    /** @type {number} */
    hp = 1;
}

class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     * @type {[number]}
     */
    a;

    /**
     * @attribute
     * @type {[number, number]}
     */
    b;

    /**
     * @attribute
     */
    c = {};

    /**
     * @attribute
     * @type {Missing}
     */
    d;

    /**
     * @attribute
     * @type {Missing[]}
     */
    e;

    /**
     * @attribute
     * @type {{}}
     */
    f;

    /**
     * @attribute
     * @type {Enemy}
     */
    g;

    /**
     * @attribute
     */
    h = 1;
}

export { Example };
