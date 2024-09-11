import { Script, Vec3 } from 'playcanvas';

enum NumberEnum {
    A = 0,
    B = 1,
    C = 2
};

enum StringEnum {
    A = 'a',
    B = 'b',
    C = 'c'
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
    e : NumberEnum;

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
