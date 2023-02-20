
// USES:
// -

// USED IN:
// NTS_ANIM
// NTS_GMATH
// NTS_GRASS
// NTS_HEIGHTFIELD
// NTS_PLAYER
// NTS_TERRAMAP
// NTS_WORLD

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// Untypescript 2023 by Kearnan Kelly


"use strict";

let NTS_GMATH = {

    PI2: Math.PI * 2.0,

    sign: function (n) {
        return (n > 0 ? 1 : n < 0 ? -1 : 0);
    },

    roundFrac: function (n, places) {
        //console.log(NTS_GMATH.PI2);
        let d = Math.pow(10, places);
        return Math.round((n + 0.000000001) * d) / d;
    },

    clamp: function (n, min, max) {
        return Math.min(Math.max(n, min), max);
    },

    pmod: function (n, m) {
        return ((n % m + m) % m);
    },

    nrand: function () {
        return Math.random() * 2.0 - 1.0;
    },

    angle: function (x, y) {
        return NTS_GMATH.pmod(Math.atan2(y, x), NTS_GMATH.PI2);
    },

    difAngle: function (a0, a1) {
        let r = NTS_GMATH.pmod(a1, NTS_GMATH.PI2) - NTS_GMATH.pmod(a0, NTS_GMATH.PI2);
        return Math.abs(r) < Math.PI ? r : r - NTS_GMATH.PI2 * NTS_GMATH.sign(r);
    },

    dot: function (x0, y0, x1, y1) {
        return (x0 * x1 + y0 * y1);
    }
};
