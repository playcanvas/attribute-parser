# PlayCanvas Attribute Parser

This is the official JSDoc attribute parser used in the PlayCanvas Editor.

It collects metadata from user scripts by parsing `@attribute` JSDoc annotations. These attributes enable the PlayCanvas Editor to expose UI controls and contextual information for your script properties.

Example

Given a script like this:

```javascript
class Rotator extends ScriptType {
  /**
   * @attribute
   * Speed determines how fast to rotate things
   */
  speed = new Vec3();

  /**
   * @attribute
   * An array of Entities to rotate
   *
   * @type {Entity[]}
   */
  thingsToRotate;
}
```

The parser outputs:


```json
{
  "rotator": {
    "attributes": {
      "speed": {
        "type": "vec3",
        "name": "speed",
        "array": false,
        "description": "Speed determines how fast to rotate things",
        "default": [0, 0, 0]
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
// Initialize the parser
const parser = new JSDocParser();
await parser.init();

// Load your source files: {[filename: string]: string}[]
const scripts = await fetchScripts([...paths, './playcanvas.d.ts']);

// Update the parser program
parser.updateProgram(scripts);

// Parse attributes from the entry point
const [attributes, errors] = parser.parseAttributes("./index.js");
```

### Attribute structure

See the [test fixtures](https://github.com/playcanvas/attribute-parser/tree/main/test/fixtures) for examples of supported JSDoc tags and output formats.

### Tests

This project includes good test coverage for all supported tag formats and edge cases.


