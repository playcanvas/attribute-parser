import { Script } from 'playcanvas';

class Example extends Script {
    /**
     * @attribute
     * @visibleWhen {b === 2}
     */
    a = 1;

    /**
     * @attribute
     * @enabledWhen {a === 3}
     */
    b = 1;

    /**
     * @attribute
     */
    c = 1;
}

export { Example };
