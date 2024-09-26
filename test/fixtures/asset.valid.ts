// eslint-disable-next-line
import { Script, Asset } from 'playcanvas';

class Example extends Script {
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
