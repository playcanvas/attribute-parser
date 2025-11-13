import { Script, TONEMAP_ACES, TONEMAP_ACES2, TONEMAP_FILMIC, TONEMAP_HEJL, TONEMAP_LINEAR, TONEMAP_NEUTRAL } from 'playcanvas';

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
const ToneMapping = {
    LINEAR: TONEMAP_LINEAR,
    FILMIC: TONEMAP_FILMIC,
    HEJL: TONEMAP_HEJL,
    ACES: TONEMAP_ACES,
    ACES2: TONEMAP_ACES2,
    NEUTRAL: TONEMAP_NEUTRAL
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
     * @type {ToneMapping}
     */
    j = ToneMapping.LINEAR;
}

export { Example };
