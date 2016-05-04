// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

precision highp float;

#define PI 3.141592654

// These 2 define values should be replaced by app before compiled
#define BLADE_HEIGHT_TALL (%%BLADE_HEIGHT_TALL%%) // height of a tall blade
#define BLADE_SEGS (%%BLADE_SEGS%%) // # of blade segments

#define BLADE_DIVS (BLADE_SEGS + 1.0)  // # of divisions
#define BLADE_VERTS (BLADE_DIVS * 2.0) // # of vertices (per side, so 1/2 total)

#define ALTITUDE_MAXHEIGHT 80.0
#define ALTITUDE_MINHEIGHT 130.0

const vec3 LIGHT_COLOR = vec3(1.0, 1.0, 0.9);

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 lightDir;
uniform float patchSize; // size of grass square area (width & height)
uniform vec2 drawPos; // centre of where we want to draw
uniform float time;  // used to animate blades
uniform sampler2D heightMap;
uniform vec3 heightMapScale;
uniform vec3 grassColorLow;
uniform vec3 grassColorHigh;

attribute float vindex; // Which vertex are we drawing - the main thing we need to know
attribute vec4 offset; // {x:x, y:y, z:z, w:rot} (blade's position & rotation)
attribute vec4 shape; // {x:width, y:height, z:lean, w:curve} (blade's shape properties)

varying vec2 vSamplePos;
varying vec4 vColor;
varying vec2 vUv;

// Rotate by an angle
vec2 rotate (float x, float y, float r) {
	float c = cos(r);
	float s = sin(r);
	return vec2(x * c - y * s, x * s + y * c);
}

// Rotate by a vector
vec2 rotate (float x, float y, vec2 r) {
	return vec2(x * r.x - y * r.y, x * r.y + y * r.x);
}

/*float makeWind1(float x, float y, float t) {
	t *= 0.1;
	float a = sin(t * 1.3 + x * 12.0 + cos(t * 2.5 + x * 12.0 + y * 21.0 + cos(t * 2.8 + x * 12.0 + y * 19.0)));
	float b = sin(t * 2.5 + y * 17.0 + cos(t * 0.7 + x * 10.0 + y * 12.0 + cos(t * 3.7 + x * 16.0 + y * 12.0)));
	float c = sin(t * 1.2 + x * 15.0 + cos(t * 3.8 + x * 16.0 + y * 15.0 + cos(t * 3.4 + y * 16.0 - x * 12.0)));
	return clamp((a + b + c) / 3.0, 0.0, 1.0);
}

float makeWind2(float x, float y, float t) {
	float w = sin(x + t) + sin((x + t) * 3.2) + cos((x + t) * 9.9) + cos(y);
	w = w / 2.0 + 0.5;
	return w;
}*/

void main() {
	float vi = mod(vindex, BLADE_VERTS); // vertex index for this side of the blade
	float di = floor(vi / 2.0);  // div index (0 .. BLADE_DIVS)
	float hpct = di / BLADE_SEGS;  // percent of height of blade this vertex is at
	float bside = floor(vindex / BLADE_VERTS);  // front/back side of blade
	float bedge = mod(vi, 2.0);  // left/right edge (x=0 or x=1)
	// Vertex position - start with 2D shape, no bend applied
	vec3 vpos = vec3(
		shape.x * (bedge - 0.5) * (1.0 - pow(hpct, 3.0)), // taper blade edges as approach tip
		0.0, // flat y, unbent
		shape.y * di / BLADE_SEGS // height of vtx, unbent
	);

	// Start computing a normal for this vertex
	vec3 normal = vec3(rotate(0.0, bside * 2.0 - 1.0, offset.w), 0.0);

	// Apply blade's natural curve amount
	float curve = shape.w;
	// Then add animated curve amount by time using this blade's
	// unique properties to randomize its oscillation
	curve += shape.w + 0.125 * (sin(time * 4.0 + offset.w * 0.2 * shape.y + offset.x + offset.y));
	// put lean and curve together
	float rot = shape.z + curve * hpct;
	vec2 rotv = vec2(cos(rot), sin(rot));
	vpos.yz = rotate(vpos.y, vpos.z, rotv);
	normal.yz = rotate(normal.y, normal.z, rotv);

	// rotation of this blade as a vector
	rotv = vec2(cos(offset.w), sin(offset.w));
	vpos.xy = rotate(vpos.x, vpos.y, rotv);

	// Based on centre of view cone position, what grid tile should
	// this piece of grass be drawn at?
	vec2 gridOffset = vec2(
		floor((drawPos.x - offset.x) / patchSize) * patchSize + patchSize / 2.0,
		floor((drawPos.y - offset.y) / patchSize) * patchSize + patchSize / 2.0
	);

	// Find the blade mesh world x,y position
	vec2 bladePos = vec2(offset.xy + gridOffset);

	vSamplePos = bladePos.xy * heightMapScale.xy + vec2(0.5, 0.5);

	// Compute wind effect
	float wind = texture2D(heightMap, vec2(vSamplePos.x - time / 2500.0, vSamplePos.y - time / 100.0) * 6.0).r;
	wind = (clamp(wind, 0.35, 0.85) - 0.35) * 2.0;
	wind = wind * wind * 1.5;

	//float wind = makeWind(vSamplePos.x * 8.0 + time / 20.0, vSamplePos.y * 8.0, 100.0) * 2.0;
	//float wind = makeWind(vSamplePos.x * 18.0, vSamplePos.y * 18.0, time * -0.1) * 2.0;

	wind *= hpct; // min(hpct * shape.y / BLADE_HEIGHT_TALL, 1.0); // scale wind by height of blade
	wind = -wind;
	rotv = vec2(cos(wind), sin(wind));
	// Wind blows in axis-aligned direction to make things simpler
	vpos.yz = rotate(vpos.y, vpos.z, rotv);
	normal.yz = rotate(normal.y, normal.z, rotv);

	// Sample the data texture to get altitude for this blade position
	float altitude = texture2D(heightMap, vSamplePos).r;
	float altclr = (clamp(altitude, 0.45, 0.75) - 0.45) * 3.3333333;
	vec3 grassColor = mix(grassColorLow, grassColorHigh, altclr);
	// Vertex color must be brighter because it is multiplied with blade texture
	grassColor = min(vec3(grassColor.r * 1.5, grassColor.g * 1.5, grassColor.b * 0.95), 1.0);
	altitude *= heightMapScale.z;

	// Translate to world coordinates
	vpos.x += bladePos.x;
	vpos.y += bladePos.y;
	vpos.z += altitude;

	// Compute light for this vertex
	float c = max(-dot(normal, lightDir), 0.0);
	c = max(c - (1.0 - hpct) * 0.75, 0.0);
	c = 0.3 + 0.7 * c;
	vColor = vec4(
		c * 0.85 + cos(offset.x * 80.0) * 0.05,
		c * 0.95 + sin(offset.y * 140.0) * 0.05,
		c * 0.95 + sin(offset.x * 99.0) * 0.05,
		1.0
	);
	vColor.rgb = vColor.rgb * LIGHT_COLOR * grassColor;

	// grass texture coordinate for this vertex
	vUv = vec2(bedge, di * 2.0);

	gl_Position = projectionMatrix * modelViewMatrix * vec4(vpos, 1.0);
}
