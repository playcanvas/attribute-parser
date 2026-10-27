/* eslint-disable */
import { Script } from 'playcanvas';

/**
 * @interface
 */
class Settings {
    /**
     * @attribute
     * @type {number}
     */
    level = 1;

    #cache = null;
}

// Members whose names aren't identifiers (private, computed, quoted, numeric) can't be
// attributes. They must be skipped, not crash parsing of the whole script.
export class Example extends Script {
    static scriptName = 'example';

    /**
     * @attribute
     * @type {number}
     */
    speed = 1;

    /**
     * @attribute
     * @type {Settings}
     */
    settings;

    #secret = 2;

    /**
     * @attribute
     * @type {number}
     */
    #taggedSecret = 3;

    ['computed'] = 4;

    'quoted' = 5;

    42 = 6;
}
