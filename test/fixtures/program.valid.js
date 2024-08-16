// eslint-disable
import confetti from 'https://esm.sh/canvas-confetti@1.6.0';
import { Script } from 'playcanvas';

// The parser should ignore https imports and not throw an error

class Example extends Script {
    /**
     * @attribute
     * @type {boolean}
     */
    a = false;

    initialize() {
        confetti();
    }
}

export { Example };
