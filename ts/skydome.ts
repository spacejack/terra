// Sky dome - hemisphere mesh that uses a square texture.
// Texture is split in 2 parts, 0-180° on top half, 180-360° on the bottom half.
// Pretty optimal texture usage compared to a skybox.
//
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

import * as bufferset from './bufferset'
type BufferSet = bufferset.BufferSet

/**
 * Create half of a dome, using half of the texture
 */
function createHalfDome (
	bs: BufferSet,
	lats: number, lngs: number, radius: number, height: number,
	uStart: number, uEnd: number, vStart: number, vEnd: number,
	startAngle = 0
) {
	const pos = bs.position
	const uv = bs.uv
	const id = bs.index
	let i = 0

	// vertices
	for (let lat = 0; lat < lats; ++lat) {
		const phi = Math.PI / 2.0 * lat / (lats - 1)  // phi (lat angle) from 0-90°
		const lrad = radius * Math.cos(phi)  // radius at this latitude
		for (let lng = 0; lng < lngs; ++lng) {
			const lambda = startAngle + Math.PI * lng / (lngs-1)  // lambda (lng angle) 180° range
			i = (bs.vertexCount + lat * lngs + lng) * 3
			pos[i++] = Math.cos(lambda) * lrad
			pos[i++] = Math.sin(lambda) * lrad
			pos[i++] = Math.sin(phi) * height
			i = (bs.vertexCount + lat * lngs + lng) * 2
			uv[i++] = uStart + ((lngs - 1 - lng) / (lngs - 1)) * (uEnd - uStart)
			uv[i++] = vStart + Math.sin(phi) * (vEnd - vStart)
		}
	}

	// indices
	i = bs.indexCount
	for (let lat = 0; lat < lats-1; ++lat) {
		for (let lng = 0; lng < lngs-1; ++lng) {
			const vi = bs.vertexCount + lat * (lngs-1) + lng
			// tri 1
			id[i++] = vi + lat
			id[i++] = vi + lat + 1
			id[i++] = vi + lats + lat + 1
			// tri 2
			id[i++] = vi + lats + lat + 1
			id[i++] = vi + lats + lat
			id[i++] = vi + lat
		}
	}

	bs.vertexCount += lats * lngs
	bs.indexCount += 6 * (lats-1) * (lngs-1)
	return bs
}

export function createMesh (
	tex: THREE.Texture, radius: number, height: number, lats = 16, lngs = 16
) : THREE.Mesh {
	// Create buffers to hold 2 half domes
	const bs = bufferset.create(
		2 * lats * lngs,
		2 * 6 * (lats-1) * (lngs-1),
		bufferset.POSITION | bufferset.UV | bufferset.INDEX
	)
	// Generate first part (using bottom half of texture)
	createHalfDome(bs, lats, lngs, radius, height, 0.0, 1.0, 0.0, 0.5, 0.0)
	// Generate second part (using top half of texture)
	createHalfDome(bs, lats, lngs, radius, height, 0.0, 1.0, 0.5, 1.0, Math.PI)

	// Now build a three.js mesh out of it...
	const geo = new THREE.BufferGeometry()
	geo.addAttribute('position', new THREE.BufferAttribute(bs.position, 3))
	geo.addAttribute('uv', new THREE.BufferAttribute(bs.uv, 2))
	geo.setIndex(new THREE.BufferAttribute(bs.index, 1))

	tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
	const mat = new THREE.MeshBasicMaterial({
		color: 0xFFFFFF, map:tex, fog: false, side: THREE.BackSide
	})

	const mesh = new THREE.Mesh(geo, mat)
	return mesh
}
