import * as TWEEN from 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/23.1.2/tween.esm.js';
import confetti from 'https://esm.sh/canvas-confetti@1.6.0';
import { Script } from 'playcanvas';

/** @enum {number} */
export const MyEnum = { value: 0 }

class Example extends Script {
    /**
     * @attribute
     * @type {boolean}
     */
    a = false;

    initialize() {
        confetti();
        new TWEEN.Tween({ x: 0 }).to({ x: 100 }, 1000).start();
    }
}

export { Example };
