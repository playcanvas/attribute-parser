import { Script, GraphNode } from 'playcanvas';

class Vec3 {}

class Example extends Script {
    /**
     * @attribute
     */
    e = new GraphNode();

    /**
     * @attribute
     */
    f = new Vec3(); // Vec3 is not from playcanvas. It's type cannot be inferred

    /**
     * @attribute
     * @type {number[]}
     * @size a
     */
    g;
}

export { Example };
