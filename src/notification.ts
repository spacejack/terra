// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

import {$e} from './util'
import * as anim from './anim'

let notifying = false

export default function notify(msg: string) {
	const elTxt = $e('notification_text')
	elTxt.textContent = msg
	if (notifying) return
	const el = $e('notification')
	el.style.display = 'block'
	el.style.opacity = '1.0'
	notifying = true
	setTimeout(function() {
		anim.fadeOut(el, 1000, function() {
			el.style.display = 'none'
			elTxt.textContent = ''
			notifying = false
		})
	}, 4000)
}
