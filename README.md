# PlayCanvas Attribute Parser

This the JSDoc attribute parser used in the PlayCanvas editor. It's used to collect metadata from a script via it's jsdoc tags.

It takes a script like this...

```javascript
class Rotator extends ScriptType {
  /**
   * @attribute
   * Speed determines how fast to rotate things"
   */
   speed = new Vec3()

   /**
    * @attribute
    *  An array of Entities to rotate
    * 
    * @type {Entity[]}
    */
   thingsToRotate
}
```

and turns it into this...


```json
{
    "rotator": {
        "attributes": {
            "speed": {
                "type": "vec3",
                "name": "speed",
                "array": false,
                "description": "Speed determines how fast to rotate things\"",
                "default": [
                    0,
                    0,
                    0
                ]
            },
            "thingsToRotate": {
                "type": "entity",
                "name": "thingsToRotate",
                "array": true,
                "description": "An array of Entities to rotate",
                "default": null
            }
        },
        "errors": []
    }
}
```

It takes the JSDocs and values and outputs the metadata in a serializable format.

### Attribute structure

You can learn more about the special tags [available here ](https://github.com/playcanvas/attribute-parser/tree/main/test/fixtures)


