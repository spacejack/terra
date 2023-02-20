
// USES:
// -

// USED IN:
// NTS_WORLD

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// Untypescript 2023 by Kearnan Kelly

"use strict";

let NTS_FPS = {

     // Create instance of Frames Per Second Monitor
    FPSMonitor: function (num) {
        if (num === void 0) {
            num = 16;
        }
        var ticks = new Array(num);
        var sum = 0;
        var index = 0;
        var f = 60.0; // frames per sec initial assumption
        for (var i = 0; i < num; ++i) {
            ticks[i] = 16.66666667;
            sum += 16.66666667;
        }
        
        /*
         * Update with new sample
         * @return New average frames/second
         * 
         * @param {type} dt
         * @returns {Number|NTS_FPS.FPSMonitor.f}
         */
        function update(dt) {
            sum -= ticks[index];
            sum += dt;
            ticks[index] = dt;
            index = (index + 1) % num;
            f = 1000 * num / sum;
            return f;
        }
        /** @return current fps string formatted to 1 decimal place */
        function fps() {
            return f.toFixed(1);
        }
        return {
            update: update,
            fps: fps
        };
    }

};