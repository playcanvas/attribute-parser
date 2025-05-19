import { Script, Vec3 } from 'playcanvas';

interface Folder {
    /**
     * This is some description of the attribute.
     * @attribute
     */
    a: boolean;

    /**
     * @attribute
     * @default 10
     * @range [10, 20]
     */
    b: number;

    /**
     * @attribute
     * @default hello
     */
    c : string;

    /**
     * @attribute
     */
    d : Vec3[];
}

interface NestedFolder {
    /**
     * @attribute
     */
    x : Folder;
}

/**
 * @interface
 */
class Example extends Script {
    /**
     * @attribute
     */
    f : Folder;

    /**
     * @attribute
     * @size 2
     */
    g : Folder[];

    /**
     * @attribute
     */
    h : NestedFolder;

    /**
     * @attribute
     */
    i = {
        /** description of a */
        a: true,
        /** @range [10, 20] */
        b: 10,
        c: 'hello',
        d: [new Vec3(1, 2, 3)]
    };

    /**
     * @attribute
     */
    l : { x: number, y: number };

    /**
     * @attribute
     */
    m : Example;

    n = 10;
}

export { Example };
