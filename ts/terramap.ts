// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

import {pmod} from './gmath'
import {Vec2, Vec3} from './vec'
import {Heightfield} from './heightfield'

/**
 * Create a texture containing height, lighting, etc. data
 * encoded into RGBA channels.
 */
export function createTexture (hf: Heightfield, lightDir: Vec3) {
	const canvas = document.createElement('canvas')
	const canvasWidth = hf.xCount + 1
	const canvasHeight = hf.yCount + 1
	canvas.width = canvasWidth
	canvas.height = canvasHeight
	const ctx = canvas.getContext('2d')
	const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
	computeData(hf, lightDir, imgData.data)
	ctx.putImageData(imgData, 0, 0)
	const tex = new THREE.Texture(canvas)
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping
	tex.needsUpdate = true
	return tex
}

/**
 * Pack heights and lighting into RGBA data
 */
function computeData (hf: Heightfield, lightDir: Vec3, buf: Uint8ClampedArray) {
	const vnorms = hf.vtxNormals
	const w = hf.xCount + 1
	const h = hf.yCount + 1
	const n = Vec3.create()
	const tStart = Date.now()
	for (let y = 0; y < h; ++y) {
		for (let x = 0; x < w; ++x) {
			let iSrc = y * w + x
			let iDst = (h-y-1) * w + x
			// Get height, scale & store in R component
			buf[iDst * 4 + 0] = Math.round(hf.heights[iSrc] / hf.maxHeight * 255.0)
			// Get normal at this location to compute light
			let ni = iSrc * 3
			n.x = vnorms[ni++]
			n.y = vnorms[ni++]
			n.z = vnorms[ni++]
			// Compute light & store in G component
			let light = Math.max(-Vec3.dot(n, lightDir), 0.0)
			light *= computeShade(hf, lightDir, x, y)
			buf[iDst * 4 + 1] = Math.round(light * 255.0)
			//buf[iDst * 4 + 2] = ... // B channel for terrain type?
			buf[iDst * 4 + 3] = 255 // must set alpha to some value > 0
		}
	}
	const dt = Date.now() - tStart
	console.log("computed terrain data texture ("+w+"x"+h+") values in "+dt+"ms")
	return buf
}

const _v = Vec2.create()

function computeShade (hf: Heightfield, lightDir: Vec3, ix: number, iy: number) {
	// Make a normalized 2D direction vector we'll use to walk horizontally
	// toward the lightsource until z reaches max height
	const shadGradRange = 5.0
	const hdir = _v
	const w = hf.xCount + 1
	const h = hf.yCount + 1
	let i = iy * w + ix
	let height = hf.heights[i] // height at this point
	hdir.x = -lightDir.x
	hdir.y = -lightDir.y
	Vec2.normalize(hdir, hdir)
	const zstep = (Vec2.length(hdir) / Vec2.length(lightDir)) * (-lightDir.z)
	let x = ix
	let y = iy
	// Walk along the direction until we discover this point
	// is in shade or the light vector is too high to be shaded
	while (height < hf.maxHeight) {
		x += hdir.x
		y += hdir.y
		height += zstep
		const qx = pmod(Math.round(x), w)
		const qy = pmod(Math.round(y), h)
		const sampleHeight = hf.heights[qy * w + qx]
		if (sampleHeight > height) {
			if (sampleHeight - height > shadGradRange)
				return 0.7  // this point is in shade
			else
				return 0.7 + 0.3 * (shadGradRange - (sampleHeight - height)) / shadGradRange
		}
	}
	return 1.0
}
