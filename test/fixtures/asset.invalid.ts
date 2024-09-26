// eslint-disable-next-line
import { Script, Asset } from 'playcanvas';

class Example extends Script {
    /**
     * @attribute
     * @resource nothing
     */
    a: Asset;

    /**
     * @attribute
     * @resource 1
     */
    b : Asset;

    /**
     * @attribute
     * @resource
     */
    c : Asset;
}

export { Example };
