import { Script, Vec3 } from 'playcanvas';

/**
 * @enum {number}
 */
const NumberEnum = {
    A: 0,
    B: 1,
    C: 2
};

/**
 * @enum {string}
 */
// eslint-disable-next-line
const StringEnum = {
    A: 'a',
    B: 'b',
    C: 'c'
};

/**
 * @enum {Vec3}
 */
// eslint-disable-next-line
const Vec3Enum = {
    A: new Vec3(1, 2, 3),
    B: new Vec3(4, 5, 6),
    C: new Vec3(7, 8, 9)
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
     * @type {Vec3Enum}
     */
    i;

    /**
     * @attribute
     * @type {NumberNumberEnum}
     */
    j = 2;
}

export { Example };
