import { Script } from 'playcanvas';

// The parser should ignore https imports and not throw an error
import confetti from "https://esm.sh/canvas-confetti@1.6.0"
import * as TWEEN from 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/23.1.2/tween.esm.js'

class Example extends Script {
    /**
     * @attribute
     * @type {boolean}
     */
    a = false;

    initialize() {
        confetti();
        window.localStorage.setItem('test', 'test');
        new TWEEN.Tween({ x: 0 }).to({ x: 100 }, 1000).start();
    }
}

export { Example };

