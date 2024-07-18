import { Script, Asset } from 'playcanvas';

class Example extends Script {
    /**
     * @attribute
     * @type {Asset}
     */
    a;

    /**
     * @attribute
     * @type {Asset}
     * @resource texture
     */
    b;

    /**
     * @attribute
     * @type {Asset[]}
     * @resource container
     */
    c;
}

export { Example };
