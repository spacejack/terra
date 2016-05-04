## Terra

© 2016 by Mike Linkovich • www.spacejack.ca

---

## [Run the Demo](http://www.spacejack.ca/projects/terra/)

This is a followup to a [previous experiment](http://github.com/spacejack/poaceae) to render grass as geometry with a vertex shader. This demo adds terrain elevation, lighting, wind, water and improves on a number of other details.

---

## Implementation

### Heightmap

An easy and efficient way to render a large area of terrain as a mesh is to simply load a heightmap bitmap into video memory. This texture can be sampled for height values for a regular grid mesh that moves with the camera. The same can be done for grass blades, so they can be re-used and placed at the same altitude as the terrain mesh.

Heights alone aren't enough to make a good looking terrain though, we also need light and shadows. Since we're dealing with static sunlight only, we can pre-compute all the lighting.

Getting data out of a bitmap is pretty straightforward in Javascript, taking advantage of the browser image element and using a canvas 2D context to read pixel values. From those we can get mesh faces (quads split into 2 traingles each,) from those faces we can compute face normals, and from those we can compute vertex normals.

`heightfield.ts` has a fairly straightforward implementation. I haven't found a heightmap Javascript implementation that I liked, so I rolled my own using `Float32Array` to store data contiguously.

Smooth directional lighting can now be computed from the normals, however to make a terrain more convincing, we also want to cast shadows. `terramap.ts` uses the height and normal data from the heightfield to cast rays from each coordinate back toward the sun direction, checking to see if the ray is blocked. It also fades from dark to light as it approaches the top of the blocking shape. This cuts down on the bitmappy look of the shadows.

Even on mobile, for a 256x256 heightfield, plain old single-threaded Javascript crunches the numbers admirably fast.

Now we have a bitmap containing height values in the R channel and light/shadow values in the G channel. B and A remain unused for this demo, however they could be used for higher-resolution data, terrain texture types, etc.

This bitmap is uploaded to video memory as a texture which can be sampled by the grass and terrain shaders.

For an in-depth article on terrain rendering with more advanced techniques for landscape detail, levels of detail by distance and texture types, see Jasmine Kent's [Gamasutra article](http://www.gamasutra.com/blogs/JasmineKent/20130904/199521/WebGL_Terrain_Rendering_in_Trigger_Rally__Part_1.php).

### Grass improvements

My previous demo took a lot of shortcuts to generate the grass geometry and animate it. This time I wanted to improve on that in a number of ways.

Individual grass blade 'lean' and 'curve' were done with simple shearing. This time the blade length remains constant, using trig to add lean and curve to the shape.

Lighting of the terrain needed to be applied to the grass. This was easy enough to do by sampling the same lightmap used by the terrain mesh, and performing the same "fog" blend to fade blades out in the distance.

I wanted better height variation for the grass. To do this I used simplex noise to give the grass heights a more 'clumpy' look.

Lighting is done dynamically, by computing a normal for each vertex rather than approximating a simple light from the general orientation of the blade.

Wind was added, coming from a consistent direction. I experimented with a number of things to get wind. Using variations and combinations of sin & cos can achieve some nice dramatic flowing effects, however when viewed up close it just looks too smooth and regular. As a source of more irregular, organic motion, I re-used the heightmap elevation data as wind magnitude values. This turned out to be not quite as dramatic or obvious when the camera is in motion, but overall I felt it looked more natural. Perhaps a mix of both techniques would provide better results. There's lots of room for experimentation here yet.

Despite all this added complexity, the grass vertex shader does not seem to be a bottleneck; the most expensive task, particularly on lower-end hardware, seems to be the antialiasing for all the blade edges. Even with AA off, the sheer number of fragments and overdraw seem to be the main limiting factor.

### Sky

I didn't discuss the skydome in the previous demo article, but I'll add a few words about it. three.js has a built-in skybox which can also be used to easily create reflections.

I wanted to keep things optimal as possible for lower end hardware, and because three.js uses 6 textures for a skybox (half of which would be obscured by the ground plane) I opted for something less resource hungry.

This skydome implementation only renders the top half of a sphere and uses just one texture mapped on to that sphere. The top half of the texture maps from 0° to 180° of the dome, the bottom half of the texture maps on to the other 180-360°.

### Water

Because I was using my own skydome, I couldn't rely on three.js for reflections. As it turns out, reflecting a skydome at water level is pretty easy - simply cast a ray from the camera location down to where it would strike an inverted dome beneath the surface. Convert to a texture coordinate and that's the reflected pixel colour. I added a small amount of ripple effect, but much more could be done here with a water shader.

Reflecting the terrain and grass in the water efficiently would not be easy without re-rendering everything. In any case, the focus of the demo is grass and I didn't want to spend too much time (yet) on other effects.

---

## Install

Written in Typescript. Install the typescript compiler (tsc) globally with:

`$ npm install -g typescript`

To build grass.js from the .ts sources:

`$ tsc`

To compile automatically while editing .ts source files, use:

`$ tsc -w`

To build a production release `index.html` and `grass.min.js` you need to install uglifyjs. Run:

`$ npm install`

Then you can do production builds with:

`$ npm run build-prod`

This demo needs to be run in a local webserver. To install a simple http server:

`$ npm install -g http-server`

Start the server at the root of this project directory:

`$ http-server`

Then browse to http://address:port/dev.html

---

## License

This work is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License:

http://creativecommons.org/licenses/by-nc/4.0/

Individual sources where indicated are licensed MIT

---

## Credits

This demo uses the awesome [three.js](http://www.threejs.org/) library.

Simplex noise by Stefan Gustavson and Joseph Gentle.

Nocturne in D flat major, Op. 27 no. 2 by Frédéric Chopin, performed by Frank Levy. Public domain recording from [musicopen.org](https://musopen.org/music/302/frederic-chopin/nocturnes-op-27/).
