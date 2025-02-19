import { Script } from 'playcanvas';

class Example extends Script {
    /**
     * This is a description of the attribute.
     *
     * @attribute
     * @type {number}
     * @title A number
     */
    a;

    _b = 10;

    _d = 10;

    /**
     * @attribute
     * @type {number}
     */
    set b(v) {
        this._b = v;
    }

    get b() {
        return this._b;
    }

    /**
     * @type {number}
     */
    c;

    /**
     * Reverse order gett/setter accessor
     * @attribute
     * @type {number}
     */
    get d() {
        return this._d;
    }

    set d(v) {
        this._d = v;
    }
}

export { Example };
