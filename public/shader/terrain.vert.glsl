// LICENSE: MIT
// Copyright (c) 2017 by Mike Linkovich

precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec2 offset;
uniform vec2 uvOffset;
uniform sampler2D heightMap;
uniform vec3 heightMapScale;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;
varying vec2 vSamplePos;

void main() {
	vec2 pos = vec2(position.xy + offset);
	vSamplePos = pos * heightMapScale.xy + vec2(0.5, 0.5);
	vec4 ch = texture2D(heightMap, vSamplePos);
	float height = ch.r * heightMapScale.z;
	vUv = uv + uvOffset;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, height, 1.0);
}
