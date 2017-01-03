// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

export interface State {
	up: number
	down: number
	left: number
	right: number
	forward: number
	back: number
	pitchup: number
	pitchdown: number
}

export const state: State = {
	up: 0,
	down: 0,
	left: 0,
	right: 0,
	forward: 0,
	back: 0,
	pitchup: 0,
	pitchdown: 0
}

const keyStates = new Array<boolean>(256).map(b => false)

// Any listeners the app has set up
const keyPressListeners: {[id: string]: () => any} = {}

function setState (k: number, s: number) {
	const cs = state;
	// arrow keys L/R/F/B
	if (k === 37)
		cs.left = s
	else if (k === 39)
		cs.right = s
	else if (k === 38)
		cs.forward = s
	else if (k === 40)
		cs.back = s
	else if (k === 87) // W
		cs.up = s
	else if (k === 83) // S
		cs.down = s
	else if (k === 81) // Q
		cs.pitchup = s
	else if (k === 65) // A
		cs.pitchdown = s
}

function onKeyDown (ev:KeyboardEvent) {
	if (!keyStates[ev.keyCode]) {
		setState(ev.keyCode, 1.0)
		keyStates[ev.keyCode] = true
		const codeStr = ev.keyCode.toString()
		if (typeof keyPressListeners[codeStr] === 'function') {
			keyPressListeners[codeStr]()
		}
	}
}

function onKeyUp (ev:KeyboardEvent) {
	if (keyStates[ev.keyCode]) {
		keyStates[ev.keyCode] = false
		setState(ev.keyCode, 0.0)
	}
}

let initialized = false

export function init() {
	if (initialized) return
	document.addEventListener('keydown', onKeyDown, true)
	document.addEventListener('keyup', onKeyUp, true)
	initialized = true
}

export function getKeyState(code: number) {
	return keyStates[code]
}

export function setKeyPressListener(code: number, fn: () => void) {
	keyPressListeners[code.toString()] = fn
}
