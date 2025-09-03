# PlayCanvas Attribute Parser

[![NPM Version](https://img.shields.io/npm/v/@playcanvas/attribute-parser)](https://www.npmjs.com/package/@playcanvas/attribute-parser)
[![NPM Downloads](https://img.shields.io/npm/dw/@playcanvas/attribute-parser)](https://npmtrends.com/@playcanvas/attribute-parser)
[![License](https://img.shields.io/npm/l/@playcanvas/attribute-parser)](https://github.com/playcanvas/attribute-parser/blob/main/LICENSE)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=flat&logo=discord&logoColor=white&color=black)](https://discord.gg/RSaMRzg)
[![Reddit](https://img.shields.io/badge/Reddit-FF4500?style=flat&logo=reddit&logoColor=white&color=black)](https://www.reddit.com/r/PlayCanvas)
[![X](https://img.shields.io/badge/X-000000?style=flat&logo=x&logoColor=white&color=black)](https://x.com/intent/follow?screen_name=playcanvas)

| [User Manual](https://developer.playcanvas.com) | [API Reference](https://api.playcanvas.com) | [Blog](https://blog.playcanvas.com) | [Forum](https://forum.playcanvas.com) |

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


