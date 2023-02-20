
// USES:
// -

// USED IN:
// NTS_APP_C

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// Untypescript 2023 by Kearnan Kelly

"use strict";

let NTS_FULLSCREEN = {

    toggle: function (el) {
        if (!is()) {
            /*if (document.mozFullscreenEnabled === false) {
             console.warn("Fullscreen may not be available")
             }*/
            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
            } else if (el.mozRequestFullScreen) {
                el.mozRequestFullScreen();
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    },

    is: function () {
        return !!document.fullscreenElement || !!document.mozFullScreenElement ||
              !!document.webkitFullscreenElement || !!document.msFullscreenElement;
    }
};