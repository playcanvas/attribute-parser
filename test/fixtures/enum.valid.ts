import { Script, Vec3, BODYGROUP_DEFAULT, TONEMAP_LINEAR, TONEMAP_NEUTRAL, TONEMAP_ACES2, TONEMAP_ACES, TONEMAP_HEJL, TONEMAP_FILMIC } from 'playcanvas';

enum NumberEnum {
    A = 13,
    B = 14,
    C = 23
};

enum StringEnum {
    A = 'a',
    B = 'b',
    C = 'c',
    "A string key" = 'd'
};

enum NumberNumberEnum {
    A = NumberEnum.A,
    B = NumberEnum.B,
    C = NumberEnum.C
};

enum ToneMapping {
    LINEAR = TONEMAP_LINEAR,
    FILMIC = TONEMAP_FILMIC,
    HEJL = TONEMAP_HEJL,
    ACES = TONEMAP_ACES,
    ACES2 = TONEMAP_ACES2,
    NEUTRAL = TONEMAP_NEUTRAL
};

class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     */
    e : NumberEnum = NumberEnum.A;

    /**
     * @attribute
     */
    f : NumberEnum = 1;

    /**
     * @attribute
     * @size 2
     */
    g : NumberEnum[];

    /**
     * @attribute
     */
    h : StringEnum;

    /**
     * @attribute
     */
    i : NumberNumberEnum = 2;

    /**
     * @attribute
     */
    j : ToneMapping = ToneMapping.LINEAR;
}

export { Example };
