import { Script } from 'playcanvas';

class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     * @visibleif {b === 2}
     */
    a = 1;

    /**
     * @attribute
     * @enabledif {a === 3}
     */
    b = 1;

    /**
     * @attribute
     */
    c = 1;
}

export { Example };
