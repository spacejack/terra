// LICENSE: MIT
// Copyright (c) 2017 by Mike Linkovich

precision highp float;

uniform sampler2D map;
uniform sampler2D heightMap;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform float grassFogFar;

varying vec2 vSamplePos;
varying vec4 vColor;
varying vec2 vUv;

void main() {
	vec4 color = vec4(vColor) * texture2D(map, vUv);
	vec4 hdata = texture2D(heightMap, vSamplePos);

	float depth = gl_FragCoord.z / gl_FragCoord.w;

	// make grass transparent as it approachs outer view distance perimeter
	color.a = 1.0 - smoothstep(grassFogFar * 0.55, grassFogFar * 0.8, depth);

	// apply terrain lightmap
	float light = hdata.g;
	color.r *= light;
	color.g *= light;
	color.b *= light;

	// then apply atmosphere fog
	float fogFactor = smoothstep(fogNear, fogFar, depth);
	color.rgb = mix(color.rgb, fogColor, fogFactor);
	// output
	gl_FragColor = color;
}
