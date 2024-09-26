import { Script, Vec3 } from 'playcanvas';

interface Folder {
    /**
     * @attribute
     */
    a: boolean;

    /**
     * @attribute
     * @default 10
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
    i = { a: true, b: 10, c: 'hello', d: [new Vec3(1, 2, 3)] };

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
