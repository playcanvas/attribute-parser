import { Script, Vec3 } from 'playcanvas';

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

class Example extends Script {
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
}

export { Example };
