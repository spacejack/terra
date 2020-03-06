// LICENSE: MIT
// Copyright (c) 2017 by Mike Linkovich

precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;

varying vec3 vSurfacePos;

void main() {
	vSurfacePos = position;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
