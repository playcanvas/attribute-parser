import { Script, Color } from 'playcanvas';

class Example extends Script {
    /**
     * @attribute
     * @type {Color}
     */
    a;

    /**
     * @attribute
     */
    b = new Color(1, 0, 0, 1);

    /**
     * @attribute
     * @type {Color[]}
     * @size 2
     */
    c;
}

export { Example };
