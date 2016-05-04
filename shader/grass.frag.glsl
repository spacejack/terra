// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

precision highp float;

uniform sampler2D map;
uniform sampler2D heightMap;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform vec3 grassColorLow;
uniform vec3 grassColorHigh;
uniform float grassFogFar;

varying vec2 vSamplePos;
varying vec4 vColor;
varying vec2 vUv;

void main() {
	vec4 color = vec4(vColor) * texture2D(map, vec2(vUv.s, vUv.t));
	vec4 hdata = texture2D(heightMap, vSamplePos);

	float depth = gl_FragCoord.z / gl_FragCoord.w;

	// apply 'grass fog' first
	float altitude = (clamp(hdata.r, 0.45, 0.75) - 0.45) * 3.3333333;
	vec3 grassColor = mix(grassColorLow, grassColorHigh, altitude);

	float fogFactor = smoothstep(fogNear, grassFogFar, depth);
	color.rgb = mix(color.rgb, grassColor, fogFactor);

	float light = hdata.g;
	color.r *= light;
	color.g *= light;
	color.b *= light;

	// then apply atmosphere fog
	fogFactor = smoothstep(fogNear, fogFar, depth);
	color.rgb = mix(color.rgb, fogColor, fogFactor);
	// output
	gl_FragColor = color;
}
