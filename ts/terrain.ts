// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

import {Vec3, Color} from './vec'

// Terrain uses a custom shader so that we can apply the same
// type of fog as is applied to the grass. This way they both
// blend to green first, then blend to atmosphere color in the
// distance.

// Uses terrain shaders (see: shader/terrain.*.glsl)

export interface Options {
	texture: THREE.Texture
	vertScript: string
	fragScript: string
	heightMap: THREE.Texture
	heightMapScale: Vec3
	fogColor: Color
	fogFar: number
	grassColorHigh: Color
	grassColorLow: Color
	grassFogFar: number
}

export interface Terrain {
	cellSize: number
	xCellCount: number
	yCellCount: number
	xSize: number
	ySize: number
	mesh: THREE.Mesh
}

export function create(opts: Options) : Terrain {
	// max x,y divisions that will fit 65536 indices
	const xCellCount = Math.floor(Math.sqrt(65536 / (3 * 2)))
	const yCellCount = xCellCount
	const cellSize = 1.0 / opts.heightMapScale.x / xCellCount

	return {
		cellSize: cellSize,
		xCellCount: xCellCount,
		yCellCount: yCellCount,
		xSize: xCellCount * cellSize,
		ySize: yCellCount * cellSize,
		mesh: createMesh(opts)
	}
}

export function update(t: Terrain, x: number, y: number) {
	const ox = Math.floor(x / t.cellSize) * t.cellSize
	const oy = Math.floor(y / t.cellSize) * t.cellSize
	const mat = t.mesh.material as THREE.RawShaderMaterial
	mat.uniforms.offset.value[0] = ox
	mat.uniforms.offset.value[1] = oy
}

const MAX_INDICES = 262144 // 65536

/** Creates a textured plane larger than the viewer will ever travel */
export function createMesh(opts: Options) {
	// max x,y divisions that will fit 65536 indices
	const xCellCount = Math.floor(Math.sqrt(MAX_INDICES / (3 * 2)))
	const yCellCount = xCellCount
	const cellSize = 1.0 / opts.heightMapScale.x / xCellCount
	const tex = opts.texture
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping
	const htex = opts.heightMap
	htex.wrapS = htex.wrapT = THREE.RepeatWrapping
	const vtxBufs = createVtxBuffers(cellSize, xCellCount+1, yCellCount+1)
	const idBuf = createIdBuffer(xCellCount+1, yCellCount+1)
	const geo = new THREE.BufferGeometry()
	geo.addAttribute('position', new THREE.BufferAttribute(vtxBufs.position, 3))
	geo.addAttribute('uv', new THREE.BufferAttribute(vtxBufs.uv, 2))
	geo.setIndex(new THREE.BufferAttribute(idBuf, 1))
	const hscale = opts.heightMapScale

	const mat = new THREE.RawShaderMaterial({
		uniforms: {
			offset: {type: '2f', value: [0.0, 0.0]},
			map: {type: 't', value: tex},
			heightMap: {type: 't', value: htex},
			heightMapScale: {type: '3f', value: [hscale.x, hscale.y, hscale.z]},
			fogColor: {type: '3f', value: Color.toArray(opts.fogColor)},
			fogNear: {type: 'f', value: 1.0},
			fogFar: {type: 'f', value: opts.fogFar},
			grassColorLow: {type: '3f', value: Color.toArray(opts.grassColorLow)},
			grassColorHigh: {type: '3f', value: Color.toArray(opts.grassColorHigh)},
			grassFogFar: {type: 'f', value: opts.grassFogFar}
		},
		vertexShader: opts.vertScript,
		fragmentShader: opts.fragScript
	})
	const mesh = new THREE.Mesh(geo, mat)
	mesh.frustumCulled = false
	return mesh
}

/**
 * @param cellSize Size of each mesh cell (quad)
 * @param xcount X vertex count
 * @param ycount Y vertex count
 */
function createVtxBuffers (cellSize: number, xcount: number, ycount: number) {
	const pos = new Float32Array(xcount * ycount * 3)
	const uv = new Float32Array(xcount * ycount * 2)
	let ix: number, iy: number
	let x: number, y: number
	let u: number, v: number
	let i = 0
	let j = 0
	for (iy = 0; iy < ycount; ++iy) {
		y = (iy - ycount / 2.0) * cellSize
		u = iy
		for (ix = 0; ix < xcount; ++ix) {
			x = (ix - xcount / 2.0) * cellSize
			v = ix
			pos[i++] = x
			pos[i++] = y
			pos[i++] = 4.0 * Math.cos(ix * 1.0) + 4.0 * Math.sin(iy * 1.0)
			uv[j++] = u * 1.0
			uv[j++] = v * 1.0
		}
	}
	return {position: pos, uv: uv}
}

/**
 * @param xcount X vertex count
 * @param ycount Y vertex count
 */
function createIdBuffer(xcount: number, ycount: number) {
	const idSize = (xcount-1) * (ycount-1) * 3 * 2
	let id: ArrayLike<number>
	if (idSize <= 65536) {
		id = new Uint16Array(idSize)
	} else {
		id = new Uint32Array(idSize)
	}
	const xc = xcount - 1
	const yc = ycount - 1
	let ix: number, iy: number
	let x: number, y: number
	let i: number
	for (y = 0; y < yc; ++y) {
		for (x = 0; x < xc; ++x) {
			const i = 6 * (y * xc + x)
			// tri 1
			id[i + 0] = (y + 0) * xcount + (x + 0)
			id[i + 1] = (y + 0) * xcount + (x + 1)
			id[i + 2] = (y + 1) * xcount + (x + 1)
			// tri 2
			id[i + 3] = (y + 1) * xcount + (x + 1)
			id[i + 4] = (y + 1) * xcount + (x + 0)
			id[i + 5] = (y + 0) * xcount + (x + 0)
		}
	}
	return id
}
