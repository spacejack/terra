// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

export function $e (id: string) {
	return document.getElementById(id) as HTMLElement
}

export function $i (id: string) {
	return document.getElementById(id) as HTMLInputElement
}

export function detectWebGL() {
	try {
		const canvas = document.createElement('canvas')
		return (
			!!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl')
		)
	}
	catch (e) {
		return null
	}
}
