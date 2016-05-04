// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

precision highp float;

const vec3 LIGHT_COLOR = vec3(1.0, 1.0, 0.875);

uniform sampler2D map;
uniform sampler2D heightMap;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform vec3 grassColorLow;
uniform vec3 grassColorHigh;
uniform float grassFogFar;

varying vec2 vUv;
varying vec2 vSamplePos;

void main() {
	vec4 color = texture2D(map, vUv);
	vec4 hdata = texture2D(heightMap, vSamplePos);

	float depth = gl_FragCoord.z / gl_FragCoord.w;

	// apply grass fog first
	float altitude = (clamp(hdata.r, 0.45, 0.75) - 0.45) * 3.3333333;
	vec3 grassColor = mix(grassColorLow, grassColorHigh, altitude);

	float fogFactor = smoothstep(fogNear, grassFogFar, depth);
	color.rgb = mix(color.rgb, grassColor, fogFactor);

	vec3 light = hdata.g * LIGHT_COLOR;
	color.rgb = color.rgb * light;

	// then apply atmosphere fog
	fogFactor = smoothstep(fogNear, fogFar, depth);
	color.rgb = mix(color.rgb, fogColor, fogFactor);
	gl_FragColor = color;
}
