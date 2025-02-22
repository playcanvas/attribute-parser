import { Script } from 'playcanvas';

/**
 * @enum {number}
 */
const NumberEnum = {
    A: 13,
    B: 14,
    C: 23
};

/**
 * @enum {string}
 */
// eslint-disable-next-line
const StringEnum = {
    A: 'a',
    B: 'b',
    C: 'c',
    'A string key': 'd'
};

/**
 * @enum {NumberEnum}
 */
// eslint-disable-next-line
const NumberNumberEnum = {
    A: NumberEnum.A,
    B: NumberEnum.B,
    C: NumberEnum.C
};

class Example extends Script {
    /**
     * @attribute
     * @type {NumberEnum}
     */
    e = NumberEnum.A;

    /**
     * @attribute
     * @type {NumberEnum}
     */
    f = 1;

    /**
     * @attribute
     * @type {NumberEnum[]}
     * @size 2
     */
    g;

    /**
     * @attribute
     * @type {StringEnum}
     */
    h;

    /**
     * @attribute
     * @type {NumberNumberEnum}
     */
    i = 2;
}

export { Example };
