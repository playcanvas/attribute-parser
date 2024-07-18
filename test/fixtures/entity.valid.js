import { Script, Entity } from 'playcanvas';

class Example extends Script {
    /**
     * @attribute
     * @type {Entity}
     */
    a;

    /**
     * @attribute
     */
    b = new Entity();

    /**
     * @attribute
     * @type {Entity[]}
     * @size 2
     */
    c;
}

export { Example };
