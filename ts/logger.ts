// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

import {$e} from './util'

let visible = false

export function setText (txt: string) {
	$e('logger').textContent = txt
}

export function setHtml (html: string) {
	$e('logger').innerHTML = html
}

export function toggle() {
	const el = $e('logger')
	visible = !visible
	if (visible) {
		el.style.display = 'inline-block'
	} else {
		el.style.display = 'none'
	}
}

export function hide() {
	$e('logger').style.display = 'none'
	visible = false
}

export function show() {
	$e('logger').style.display = 'inline-block'
	visible = true
}

export function isVisible() {
	return visible
}
