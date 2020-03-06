## Terra

© 2017-2020 by Mike Linkovich • spacejack.github.io

---

## [Run the Demo](https://spacejack.github.io/terra/)

![screenshot](screenshots/intro.jpg?raw=true)

This is a followup to a [previous experiment](https://github.com/spacejack/poaceae) to render grass as geometry with a vertex shader. This demo adds terrain elevation, improved lighting, grass animation, wind, water and other details.

Additionally, this project has been updated since its initial release. It now features terrain texturing, transitions between terrain types, more grass lighting improvements, better wind animation, a few minor fixes and a better out-of-the-box build with browserify and TypeScript 2.1. And finally this readme has been re-written to provide a more detailed description of the implementation.

# Implementation

## Grass

The writeup for how grass instances are rendered and placed within the view frustum was included in my [initial experiment](https://github.com/spacejack/poaceae/blob/master/readme.md) and that technique remains essentially the same in this implementation.

#### 1. Geometry

In this version, the grass "lean" and "curve" shapes were done more correctly using trig functions to angle the blade and curve it toward the tip.

I also wanted more organic height variation for the grass. To do this I used simplex noise when the blade variations are initially generated (by the CPU) to give the grass heights a more 'clumpy' look.

#### 2. Lighting

Directional lighting is done dynamically in this version by computing a normal for each grass blade vertex at its current orientation rather than a crude approximation from the general orientation of the blade. A simple form of ambient occlusion is also applied - the lower the vertex on the blade, the less light it receives.

My initial inclination was to perform typical diffuse lighting with a lot of ambient light on the shaded side of the blade. However this does not account for the very translucent nature of blades of grass. So rather than clamping `normal • light` to 0-1, I used the absolute value (slightly reduced and tinted yellow when the sign was negative.) This means that blades are actually darkest when perpendicular to the light source.

As a finishing touch, to give the lighting a bit more pop, I used a small amount of specular highlighting when the blade was reflecting the sun into the camera. The higher the specular value, the more the grass will look like shimmering gold.

![too specular](screenshots/too-specular.jpg?raw=true)

*Oops, too much specular.*

And finally, because the terrain has light and shadow, that same lighting needed to be applied to the grass. This was easy enough to do by sampling the same lightmap (see Terrain Heightmap section below) used by the terrain mesh and multiplying it by the lighting computed for the grass blade.

#### 3. Animation

The original demo had a small amount of regular oscillation applied to each blade of grass (offset by using the x and y coordinates of the blade.)

That oscillation remains but a larger wind effect was also added, coming from a consistent direction. I experimented with a number of things to get wind. Using variations and combinations of sin & cos can achieve some nice dramatic flowing effects, however when viewed up close it just looks too smooth and regular. As a source of more irregular, organic motion, I tried creating a variety of noise textures to sample, stored in the B channel of the heightmap texture. Ironically, at one point I accidentally used the G channel of the heightmap which was the light map rather than B which was intended for wind noise, and this gave me the best result!

#### 4. Fading into the background

My original solution to fading out the back edge of the grass patch was to apply a background-coloured fog. This time however the terrain has a texture and this approach of fading to a solid colour would not work. Instead alpha blending is used to fade out blades as they approach the draw distance limit. This actually looks better than my original approach which had much more noticable pop-in when silhouetted against the sky.

One problem remained with this approach however - when viewing grass geometry up-close, you can inevitably see through to the ground. I wanted this to be a dirt-like colour, however in the distance it needed to be green (representing blades of grass in the distance.) To solive this, I compute a "foreground" colour of the ground texture by converting to grayscale, then colourizing it to a "dirt" colour. The dirt colour and the original colour of the grass texture are mixed based on distance from the camera. The closer to the camera, the more dirt, the further away, the more grass-like colour. This ends up working pretty well.

![dirt transition](screenshots/dirt-transition.jpg?raw=true)

*Shows fade-to-dirt effect without grass geometry.*

This effect should not be applied when rendering non-grass texture types however, so it is multiplied by the "grass amount" factor to reduce it to 0 when not wanted. (See Terrain Types and Transitions below.)

## Terrain Heightmap

An easy and efficient way to render a large area of terrain as a mesh is to simply load a heightmap bitmap into video memory as a texture. This texture can be sampled for height (and other) data. The terrain geometry can be a flat grid mesh that moves with the camera, using height values from the texture to set the height component of each vertex. This eliminates the need to update any geometry with the CPU and re-upload it to video memory.

![heightmap diagram](screenshots/heightmap-diagram.jpg?raw=true)

*The vertex shader samples values from the height map at vertex X,Y coordinates to get elevation Z. The terrain mesh moves with the camera.*

Similarly when rendering grass blades, that same height data can be sampled to adjust the elevation of each blade.

Heights alone aren't enough to make a good looking terrain though, we also need light and shadows. Since we're dealing with static sunlight only, we can pre-compute all of the lighting. In order to do that, we need to compute a normal for each pixel in the heightfield.

Getting data out of the heightfield bitmap is pretty straightforward in Javascript, taking advantage of the browser image element and using a canvas 2D context to read pixel values. From those we can get mesh faces (quads split into 2 traingles each,) from those faces we can compute face normals, and from those we can compute vertex normals.

`heightfield.ts` has a fairly straightforward implementation. I haven't found a heightmap Javascript implementation that I liked, so I rolled my own using `Float32Array` to store data contiguously.

Smooth directional lighting can now be computed from the normals, however to make a terrain more convincing, we also want to cast shadows. `terramap.ts` uses the height and normal data from the heightfield to cast rays from each coordinate back toward the sun direction, checking to see if the ray is blocked. It also fades from dark to light as it approaches the top of the blocking shape. This cuts down on the bitmappy look of the shadows.

Even on mobile, for a 256x256 heightfield, plain old single-threaded Javascript crunches the numbers admirably fast.

Now we have a bitmap containing height values in the R channel and light/shadow values in the G channel.

I also wanted a "noise" texture. So the grayscale file `noise.jpg` is loaded and then stored in the B channel.

The alpha channel remains unused for this demo, however the extra channel could be used for higher-resolution data, terrain texture types, etc. (Note that alpha must be non-zero, otherwise some browsers will turn all the channels black for pixels with 0 alpha!)

This heightfield data is uploaded to video memory as a texture which can be sampled by the grass and terrain shaders.

For an in-depth article on terrain rendering with more advanced techniques for landscape detail, levels of detail by distance and texture types, see Jasmine Kent's [Gamasutra article](https://www.gamasutra.com/blogs/JasmineKent/20130904/199521/WebGL_Terrain_Rendering_in_Trigger_Rally__Part_1.php).

#### Terrain textures and transitions

Usually a terrain will need to have more than just one texture type. In this demo I wanted to have a sandy beach-like texture near the water's edge and grass at higher elevations.

Determining which texture type to use is pretty simple here - if the elevation of the current position is above or below a certain point (just above water level.)

Ideally we'd like to fade this transition since a hard edge doesn't look too great. This can be done by selecting an elevation range to transition between. The blend factor can be computed like this:

	float fadeAmount = (clamp(elevation, MIN_ELEVATION, MAX_ELEVATION) - MIN_ELEVATION)
		* (1.0 / (MAX_ELEVATION - MIN_ELEVATION));

This is nice and smooth, but very regular. To improve on this transition and make it look more organinc, we can perturb the elevation with some noise factor based on our X and Y coordinates. Earlier I had planned to create a channel for wind, however found that the lighting channel worked really well instead. So I used this free channel for a transition noise texture. Since we're already sampling the elevation at this point, the noise comes for free (as opposed to creating an expensive noise function, or performing another texture sample.)

This same elevation-with-noise transition can be applied when rendering the grass. As the elevation approaches the sand, the grass geometry scale is reduced to zero (at which point the geometry is degenerate and doesn't render.) Once again, the grass vertex shader already needs to sample for elevation and can also get the noise value for free.

![terrain transition](screenshots/terrain-transition.jpg?raw=true)

*Using blending and noise gives us a better beach-to-grass transition.*

## Sky

I didn't discuss the skydome in the previous demo article, but I'll add a few words about it. three.js has a built-in skybox which can also be used to easily create reflections.

I wanted to keep things optimal as possible for lower end hardware, and because three.js uses 6 textures for a skybox (half of which would be obscured by the ground plane) I opted for something a little less resource hungry.

This skydome implementation only renders the top half of a sphere and uses just one panoramic skydome texture mapped on to that sphere.

### Water

Because I was using my own skydome, I couldn't rely on three.js for reflections. As it turns out, reflecting a skydome at water level is pretty easy - simply cast a ray from the camera location down to where it would strike an inverted dome beneath the surface. Convert to a texture coordinate and that's the reflected pixel colour. I added a small amount of ripple effect, but much more could be done here with a water shader.

Reflecting the terrain and grass in the water efficiently would not be easy without re-rendering everything. In any case, the focus of the demo is grass and I didn't want to spend too much time (yet) on other effects.

---

## Install

	npm install

## Start localhost server, compile-on-save

	npm start

Then go to http://localhost:3000 in your browser

## Build minified

	npm run build

Outputs terra.js in `public/js`.

---

## License

This work is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License:

https://creativecommons.org/licenses/by-nc/4.0/

Individual sources where indicated are licensed MIT

---

## Credits

This demo uses the awesome [three.js](https://threejs.org/) library.

Simplex noise by Stefan Gustavson and Joseph Gentle.

Nocturne in D flat major, Op. 27 no. 2 by Frédéric Chopin, performed by Frank Levy. Public domain recording from [musicopen.org](https://musopen.org/music/302/frederic-chopin/nocturnes-op-27/).
