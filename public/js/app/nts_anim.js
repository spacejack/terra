
// USES:
// NTS_GMATH

// USED IN:
// NTS_APP_C
// NTS_NOTIFICATION

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// Untypescript 2023 by Kearnan Kelly

"use strict";

let NTS_ANIM = {

    PRECISION: 5,

    // Fades element from o0 opacity to o1 opacity in dur milliseconds.
    // Invokes complete callback when done.
    fade: function (el, o0, o1, dur, complete) {
        let startT = Date.now();
        let prevO = (0, NTS_GMATH.roundFrac)(o0, NTS_ANIM.PRECISION).toString();
        
        el.style.opacity = prevO;
        
        function fadeLoop() {
            let t = Date.now() - startT;
            
            if (t >= dur) {
                el.style.opacity = (0, NTS_GMATH.roundFrac)(o1, NTS_ANIM.PRECISION).toString();
                if (complete) {
                    complete();
                }    
            } else {
                // round off so style value isn't too weird
                var o = (0, NTS_GMATH.roundFrac)(o0 + t / dur * (o1 - o0), NTS_ANIM.PRECISION).toString();
                if (o !== prevO) {
                    // only update style if value has changed
                    el.style.opacity = o;
                    prevO = o;
                }
                requestAnimationFrame(fadeLoop);
            }
        }
        requestAnimationFrame(fadeLoop);
    },

    /*
     * Go from 0 opacity to 1 in dur milliseconds.
     * @param el Element to fade
     * @param dur Fade duration in ms
     * @param complete Callback on complete
     */
    fadeIn: function (el, dur, complete) {
        NTS_ANIM.fade(el, 0, 1, dur, complete);
    },

    /*
     * Go from 1 opacity to 0 in dur milliseconds.
     * @param el Element to fade
     * @param dur Fade duration in ms
     * @param complete Callback on complete
     */
    fadeOut: function (el, dur, complete) {
        NTS_ANIM.fade(el, 1, 0, dur, complete);
    }
};
