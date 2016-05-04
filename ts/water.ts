//
// Water mesh
// A flat plane extending to frustum depth that follows
// viewer position horizontally.
// Shader does environmental mapping to reflect skydome,
// blend with water colour, and apply fog in distance.
//

// Uses water shaders (see: shader/water.*.glsl)

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

import {Vec3, Color} from './vec'

export interface Options {
	envMap: THREE.Texture
	vertScript: string
	fragScript: string
	waterLevel: number
	waterColor: Color
	fogColor: Color
	fogNear: number
	fogFar: number
}

let _time = 0

export function createMesh(opts: Options) {
	const mat = new THREE.RawShaderMaterial({
		uniforms: {
			time: {type: '1f', value: 0.0},
			viewPos: {type: '3f', value: [0.0, 0.0, 10.0]},
			map: {type: 't', value: opts.envMap},
			waterLevel: {type: '1f', value: opts.waterLevel},
			waterColor: {type: '3f', value: Color.toArray(opts.waterColor)},
			fogColor: {type: '3f', value: Color.toArray(opts.fogColor)},
			fogNear: {type: 'f', value: 1.0},
			fogFar: {type: 'f', value: opts.fogFar * 1.5},
		},
		vertexShader: opts.vertScript,
		fragmentShader: opts.fragScript
	})
	const mesh = new THREE.Mesh(
		new THREE.PlaneBufferGeometry(2000.0, 2000.0),
		mat //new THREE.MeshBasicMaterial({color: opts.waterColor.getHex(), fog: true})
	)
	mesh.frustumCulled = false
	_time = Date.now()
	return mesh
}

export function update(mesh: THREE.Mesh, viewPos: Vec3) {
	mesh.position.x = viewPos.x
	mesh.position.y = viewPos.y
	const mat = mesh.material as THREE.RawShaderMaterial
	const vp = mat.uniforms['viewPos'].value as number[]
	vp[0] = viewPos.x
	vp[1] = viewPos.y
	vp[2] = viewPos.z

	mat.uniforms['time'].value = (Date.now() - _time) / 250.0
}
