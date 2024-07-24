# PlayCanvas Attribute Parser

This the official JSDoc attribute parser used in the PlayCanvas editor. 

It's used in the PlayCanvas Editor to collect metadata from jsdoc annotated users scripts. This allows special `@attribute` members which can surface contextual data about class members.

## A quick examples

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

and turns it into the following data ...


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

JSDocs tags are parsed and values and outputs the metadata in a serializable format.

### Usage 

```javascript
// Initialise the parser
const parser = new JSDocParser();
await parser.init();

// fetch your program source {[filename: string, contents: string][]}
const scripts = await fetchScripts([...paths, './playcanvas.d.ts']);

// update the progam
parser.updateProgram(scripts)

// Parse the program, starting from the first path
const [attribute, errors] parser.parseAttributes("./index.js");
```

### Attribute structure

You can learn more about the special tags [available here ](https://github.com/playcanvas/attribute-parser/tree/main/test/fixtures)


### Tests

We provide good coverage


