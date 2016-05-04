// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

export function $e (id: string) {
	return document.getElementById(id)
}

export function $i (id: string) {
	return document.getElementById(id) as HTMLInputElement
}

export function detectWebGL() {
	try {
		const canvas = document.createElement('canvas')
		return !!window['WebGLRenderingContext'] &&
			(!!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl'))
	}
	catch (e) {
		return null
	}
}
