// eslint-disable-next-line
import { Script, Asset } from 'playcanvas';

class Example extends Script {
    static scriptName = 'example';

    /** @attribute */
    a : Asset;

    /** 
     * @attribute
     * @resource texture
     */
    b : Asset;

    /**
     * @attribute
     * @resource container
     */
    c : Asset[];
}

export { Example };
