// Vector Math with library-agnostic interface types.
// i.e. Any object with matching property names will work,
// whether three.js, cannon.js, etc.
//
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

/** 2D Vector type */
export interface Vec2 {
	x: number
	y: number
}

/** 3D Vector type */
export interface Vec3 {
	x: number
	y: number
	z: number
}

/** RGB Color */
export interface Color {
	r: number
	g: number
	b: number
}

/**
 * 3D Vector functions
 */
export namespace Vec2 {
	export function create (x?: number, y?: number) {
		return {
			x: (typeof x === 'number') ? x : 0.0,
			y: (typeof y === 'number') ? y : 0.0
		}
	}

	export function clone(v: Vec2) {
		return create(v.x, v.y)
	}

	export function set (v: Vec2, x: number, y: number) {
		v.x = x
		v.y = y
	}

	export function copy (src: Vec2, out: Vec2) {
		out.x = src.x
		out.y = src.y
	}

	export function length (v: Vec2) {
		return Math.sqrt(v.x * v.x + v.y * v.y)
	}

	export function setLength (v: Vec2, l: number, out: Vec2) {
		let s = length(v)
		if (s > 0.0) {
			s = l / s
			out.x = v.x * s
			out.y = v.y * s
		}
		else {
			out.x = l
			out.y = 0.0
		}
	}

	export function dist(v0: Vec2, v1: Vec2) {
		const dx = v1.x - v0.x
		const dy = v1.y - v0.y
		return Math.sqrt(dx * dx + dy * dy)
	}

	export function normalize (v: Vec2, out: Vec2) {
		setLength(v, 1.0, out)
	}

	export function dot (v0: Vec2, v1: Vec2) {
		return (v0.x * v1.x + v0.y * v1.y)
	}

	export function det (v0: Vec2, v1: Vec2) {
		return (v0.x * v1.y - v0.y * v1.x)
	}

	/** Rotate v by r radians, result in out. (v and out can reference the same Vec2 object) */
	export function rotate (v: Vec2, r: number, out: Vec2) {
		const c = Math.cos(r),
			s = Math.sin(r),
			x = v.x, y = v.y
		out.x = x * c - y * s
		out.y = x * s + y * c
	}

	/** Uses pre-computed cos & sin values of rotation angle */
	export function rotateCS (v: Vec2, c: number, s: number, out: Vec2) {
		const x = v.x, y = v.y
		out.x = x * c - y * s
		out.y = x * s + y * c
	}

	/** nx,ny should be normalized; vx,vy length will be preserved */
	export function reflect (v: Vec2, n: Vec2, out: Vec2) {
		const d = dot(n, v)
		out.x = v.x - 2.0 * d * n.x
		out.y = v.y - 2.0 * d * n.y
	}

	export function toArray (v: Vec2) {
		return [v.x, v.y]
	}
}

/**
 * 3D Vector functions
 */
export namespace Vec3 {
	export function create (x?: number, y?: number, z?: number) {
		return {
			x: (typeof x === 'number') ? x : 0.0,
			y: (typeof y === 'number') ? y : 0.0,
			z: (typeof z === 'number') ? z : 0.0
		}
	}

	export function clone(v: Vec3) {
		return create(v.x, v.y, v.z)
	}

	export function set (v: Vec3, x: number, y: number, z: number) {
		v.x = x; v.y = y; v.z = z
	}

	export function copy (src: Vec3, out: Vec3) {
		out.x = src.x
		out.y = src.y
		out.z = src.z
	}

	export function length (v: Vec3) {
		return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
	}

	export function setLength (v: Vec3, l: number, out: Vec3) {
		let s = length(v)
		if (s > 0.0) {
			s = l / s
			out.x = v.x * s
			out.y = v.y * s
			out.z = v.z * s
		} else {
			out.x = l
			out.y = 0.0
			out.z = 0.0
		}
	}

	export function dist(v0: Vec3, v1: Vec3) {
		const dx = v1.x - v0.x
		const dy = v1.y - v0.y
		const dz = v1.z - v0.z
		return Math.sqrt(dx * dx + dy * dy + dz * dz)
	}

	export function normalize (v: Vec3, out: Vec3) {
		Vec3.setLength(v, 1.0, out)
	}

	export function dot (a: Vec3, b: Vec3) {
		return a.x * b.x + a.y * b.y + a.z * b.z
	}

	export function cross (a: Vec3, b: Vec3, out: Vec3) {
		const ax = a.x, ay = a.y, az = a.z,
			bx = b.x, by = b.y, bz = b.z
		out.x = ay * bz - az * by
		out.y = az * bx - ax * bz
		out.z = ax * by - ay * bx
	}

	export function toArray (v: Vec3) {
		return [v.x, v.y, v.z]
	}
}

/**
 * RGB Color functions
 */
export namespace Color {
	export function create (r?: number, g?: number, b?: number) {
		return {
			r: (typeof r === 'number') ? r : 0.0,
			g: (typeof g === 'number') ? g : 0.0,
			b: (typeof b === 'number') ? b : 0.0
		}
	}

	export function toArray (c: Color) {
		return [c.r, c.g, c.b]
	}

	export function to24bit (c: Color) {
		return (c.r * 255) << 16 ^ (c.g * 255) << 8 ^ (c.b * 255) << 0
	}
}
