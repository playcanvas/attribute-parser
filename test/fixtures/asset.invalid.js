// eslint-disable-next-line
import { Script, Asset } from 'playcanvas';

class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     * @type {Asset}
     * @resource nothing
     */
    a;

    /**
     * @attribute
     * @type {Asset}
     * @resource 1
     */
    b;

    /**
     * @attribute
     * @type {Asset}
     * @resource
     */
    c;
}

export { Example };
