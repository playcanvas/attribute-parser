import { Script, BODYGROUP_DEFAULT } from 'playcanvas';

/**
 * @enum {number}
 */
const NumberEnum = {
    A: 13,
    B: 14,
    C: 23
};

/**
 * @enum {number}
 */
const ImportedEnum = {
    A: BODYGROUP_DEFAULT
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
    static scriptName = 'example';

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

    /**
     * @attribute
     * @type {ImportedEnum}
     */
    j = ImportedEnum.A;
}

export { Example };
