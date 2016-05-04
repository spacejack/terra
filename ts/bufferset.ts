// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

export const POSITION = 0x01
export const NORMAL   = 0x02
export const COLOR    = 0x04
export const UV       = 0x08
export const INDEX    = 0x10
export const ALL      = POSITION | NORMAL | COLOR | UV | INDEX

export interface BufferSet {
	position: Float32Array
	normal: Float32Array
	color: Float32Array
	uv: Float32Array
	index: Uint16Array
	vertexCount: number // useful offsets when filling buffers
	indexCount: number
}

/**
 * Creates a bufferset
 * @param numVtx Number of vertices
 * @param numId Number of indices
 * @param b Types of buffers to create (bitflags)
 */
export function create (numVtx: number, numId: number, b?: number) {
	b = (typeof b === 'number') ? b & ALL : ALL
	return {
		position: (b & POSITION) ? new Float32Array(numVtx * 3) : null,
		normal: (b & NORMAL) ? new Float32Array(numVtx * 3) : null,
		color: (b & COLOR) ? new Float32Array(numVtx * 4) : null,
		uv: (b & UV) ? new Float32Array(numVtx * 2) : null,
		index: (b & INDEX) ? new Uint16Array(numId) : null,
		vertexCount: 0,
		indexCount: 0
	}
}
