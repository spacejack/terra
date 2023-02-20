
// USES:
// -

// USED IN:
// NTS_APP_C
// NTS_PLAYER_C
// NTS_WORLD_C

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// Untypescript 2023 by Kearnan Kelly

"use strict";

let NTS_INPUT = {

    state: {
        up: 0,
        down: 0,
        left: 0,
        right: 0,
        forward: 0,
        back: 0,
        pitchup: 0,
        pitchdown: 0
    },

    keyStates: [],
    keyPressListeners: {},

    initialized: false,

    setState: function (k, s) {
        var cs = this.state;
        // arrow keys L/R/F/B
        if (k === 37) // left arrow
            cs.left = s;
        else if (k === 39) // right arrow
            cs.right = s;
        else if (k === 38) // up arrow
            cs.forward = s;
        else if (k === 40) // down arrow
            cs.back = s;
        else if (k === 87) // W
            cs.up = s;
        else if (k === 83) // S
            cs.down = s;
        else if (k === 81) // Q
            cs.pitchup = s;
        else if (k === 65) // A
            cs.pitchdown = s;
    },

    onKeyDown: function (ev) {
        if (!this.keyStates[ev.keyCode]) {
            this.setState(ev.keyCode, 1.0);
            this.keyStates[ev.keyCode] = true;
            var codeStr = ev.keyCode.toString();
            if (typeof this.keyPressListeners[codeStr] === 'function') {
                //console.log(codeStr);
                this.keyPressListeners[codeStr]();
            }
        }
    },

    onKeyUp: function (ev) {
        if (this.keyStates[ev.keyCode]) {
            this.keyStates[ev.keyCode] = false;
            this.setState(ev.keyCode, 0.0);
        }
    },

    init: function () {
        if (this.initialized) {
            return;
        }
        document.addEventListener('keydown', this.onKeyDown.bind(this), true);
        document.addEventListener('keyup', this.onKeyUp.bind(this), true);
        this.initialized = true;
    },

    getKeyState: function (code) {
        return this.keyStates[code];
    },

    setKeyPressListener: function (code, fn) {
        this.keyPressListeners[code.toString()] = fn;
    }
};


        