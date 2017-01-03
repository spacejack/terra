// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

declare global {
	interface Navigator {
		standalone?: boolean
	}
	interface External {
		msIsSiteMode(): boolean
	}
}

/** Try to determine if was launched from homescreen/desktop app launcher */
export const isStandalone = (function(){
	// iOS
	if (navigator.standalone !== undefined)
		return !!navigator.standalone
	// Windows Mobile
	if (window.external && window.external.msIsSiteMode)
		return !!window.external.msIsSiteMode()
	// Chrome
	return window.matchMedia('(display-mode: standalone)').matches
}())

export const isMobile = (function(){
	const a = !!navigator.userAgent.match(/Android/i)
	const bb = !!navigator.userAgent.match(/BlackBerry/i)
	const ios = !!navigator.userAgent.match(/iPhone|iPad|iPod/i)
	const o = !!navigator.userAgent.match(/Opera Mini/i)
	const w = !!navigator.userAgent.match(/IEMobile/i)
	const ff = !!navigator.userAgent.match(/\(Mobile/i)
	const any = (a || bb || ios || o || w || ff)
	return {
		Android: a,
		BlackBerry: bb,
		iOS: ios,
		Opera: o,
		Windows: w,
		FireFox: ff,
		any: any
	}
}())
