// LICENSE: MIT
// Copyright (c) 2017 by Mike Linkovich

precision highp float;

#define TRANSITION_LOW   (%%TRANSITION_LOW%%)
#define TRANSITION_HIGH  (%%TRANSITION_HIGH%%)
#define TRANSITION_NOISE 0.06

const vec3 LIGHT_COLOR = vec3(1.0, 1.0, 0.9);
const vec3 DIRT_COLOR = vec3(0.77, 0.67, 0.45);

uniform sampler2D map1;
uniform sampler2D map2;
uniform sampler2D heightMap;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform float grassFogFar;

varying vec2 vUv;
varying vec2 vSamplePos;

void main() {
	vec4 hdata = texture2D(heightMap, vSamplePos);
	float altitude = hdata.r;
	// perturb altitude with some noise using the B channel.
	float noise = hdata.b;
	altitude += noise * TRANSITION_NOISE - (TRANSITION_NOISE / 2.0);

	// Determine whether this position is more grass or more dirt
	float grassAmount = (clamp(altitude, TRANSITION_LOW, TRANSITION_HIGH) - TRANSITION_LOW)
		* (1.0 / (TRANSITION_HIGH - TRANSITION_LOW));

	// Sample both textures and mix proportionately
	vec3 color = mix(
		texture2D(map2, vUv).rgb,
		texture2D(map1, vUv).rgb,
		grassAmount
	);

	vec3 light = hdata.g * LIGHT_COLOR;
	float depth = gl_FragCoord.z / gl_FragCoord.w;

	// If terrain is covered by grass geometry, blend color to 'dirt'
	float dirtFactor = 1.0 - smoothstep(grassFogFar * 0.2, grassFogFar * 0.65, depth);
	// If we're not on a grass terrain type, don't shade it...
	dirtFactor *= grassAmount;
	float dirtShade = (color.r + color.g + color.b) / 3.0;

	// Compute terrain color
	color = mix(color, DIRT_COLOR * dirtShade, dirtFactor) * light;

	// then apply atmosphere fog
	float fogFactor = smoothstep(fogNear, fogFar, depth);
	color = mix(color, fogColor, fogFactor);
	gl_FragColor = vec4(color, 1.0);
}
