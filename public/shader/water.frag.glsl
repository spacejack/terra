// LICENSE: MIT
// Copyright (c) 2017 by Mike Linkovich

precision highp float;

#define PI 3.141592654

uniform sampler2D map;
uniform float waterLevel;
uniform vec3 viewPos;
uniform float time;
uniform vec3 waterColor;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

varying vec3 vSurfacePos;

void main() {
	// Get the direction from camera through this point on the surface of the water.
	// Then project that on to an upside-down skydome to get the UV from the skydome texture.
	// X & Y of plane are moving with viewer, so we only need Z difference to get dir.
	vec3 viewDir = normalize(vec3(vSurfacePos.xy, waterLevel - viewPos.z));

	vec2 uv = vec2(
		// horizontal angle converted to a texcoord between 0.0 and 1.0
		atan(viewDir.y, viewDir.x) / (PI * 2.0),
		// down angle converted to V tex coord between 0.0 and 1.0
		asin(-viewDir.z) / (PI / 2.0)
	);

	// wave distortion
	float distortScale = 1.0 / length(vSurfacePos - viewPos);
	vec2 distort = vec2(
		cos((vSurfacePos.x - viewPos.x) / 1.5 + time) + sin((vSurfacePos.y - viewPos.y) / 1.5 + time),
		0.0
	) * distortScale;
	uv += distort;

	// Now we can sample the env map
	vec4 color = texture2D(map, uv);

	// Mix with water colour
	color.rgb = color.rgb * waterColor;

	// Apply fog
	float depth = gl_FragCoord.z / gl_FragCoord.w;
	float fogFactor = smoothstep(fogNear, fogFar, depth);
	color.rgb = mix(color.rgb, fogColor, fogFactor);
	gl_FragColor = color;
}
