/*global THREE*/

// USES:
// THREE
// NTS_GMATH
// NTS_VEC

// USED IN:
// NTS_WORLD_C

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// Untypescript 2023 by Kearnan Kelly

"use strict";


let NTS_TERRAMAP = {

    // Create a texture containing height, lighting,
    // etc. data encoded into RGBA channels.
    createTexture: function (hf, lightDir, imgWind) {
        let canvas = document.createElement('canvas');
        let canvasWidth = hf.xCount + 1;
        let canvasHeight = hf.yCount + 1;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        let ctx = canvas.getContext('2d');
        let imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        // Fill R (height) and G (light) values from heightfield data and computed light
        this.computeData(hf, lightDir, imgData.data);
        // Add wind intensity to B channel
        this.addWindData(imgWind, imgData.data);
        ctx.putImageData(imgData, 0, 0);
        let tex = new THREE.Texture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.needsUpdate = true;
        return tex;
    },

    // Pack heights and lighting into RGBA data
    computeData: function (hf, lightDir, buf) {
        let vnorms = hf.vtxNormals;
        let w = hf.xCount + 1;
        let h = hf.yCount + 1;
        let n = NTS_VEC.Vec3.create();
        let tStart = Date.now();
        
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                let iSrc = y * w + x;
                let iDst = (h - y - 1) * w + x;
                // Get height, scale & store in R component
                buf[iDst * 4 + 0] = Math.round(hf.heights[iSrc] / hf.maxHeight * 255.0);
                // Get normal at this location to compute light
                let ni = iSrc * 3;
                n.x = vnorms[ni++];
                n.y = vnorms[ni++];
                n.z = vnorms[ni++];
                // Compute light & store in G component
                let light = Math.max(-NTS_VEC.Vec3.dot(n, lightDir), 0.0);
                light *= this.computeShade(hf, lightDir, x, y);
                buf[iDst * 4 + 1] = Math.round(light * 255.0);
                //buf[iDst * 4 + 2] = ... // B channel for terrain type?
                buf[iDst * 4 + 3] = 255; // must set alpha to some value > 0
            }
        }
        let dt = Date.now() - tStart;
        
        console.log("computed terrain data texture (".concat(w, "x").concat(h, ") values in ").concat(dt, "ms"));
        
        return buf;
    },

    _v: NTS_VEC.Vec2.create(),

    computeShade: function (hf, lightDir, ix, iy) {
        // Make a normalized 2D direction vector we'll use to walk horizontally
        // toward the lightsource until z reaches max height
        let shadGradRange = 5.0;
        let hdir = this._v;
        let w = hf.xCount + 1;
        let h = hf.yCount + 1;
        let i = iy * w + ix;
        let height = hf.heights[i]; // height at this point
        hdir.x = -lightDir.x;
        hdir.y = -lightDir.y;
        NTS_VEC.Vec2.normalize(hdir, hdir);
        let zstep = (NTS_VEC.Vec2.length(hdir) / NTS_VEC.Vec2.length(lightDir)) * (-lightDir.z);
        let x = ix;
        let y = iy;
        // Walk along the direction until we discover this point
        // is in shade or the light vector is too high to be shaded
        while (height < hf.maxHeight) {
            x += hdir.x;
            y += hdir.y;
            height += zstep;
            let qx = (0, NTS_GMATH.pmod)(Math.round(x), w);
            let qy = (0, NTS_GMATH.pmod)(Math.round(y), h);
            let sampleHeight = hf.heights[qy * w + qx];
            if (sampleHeight > height) {
                if (sampleHeight - height > shadGradRange)
                    return 0.7; // this point is in shade
                else
                    return 0.7 + 0.3 * (shadGradRange - (sampleHeight - height)) / shadGradRange;
            }
        }
        return 1.0;
    },

    // Put wind data from the wind image to the b channel
    addWindData: function (imgWind, buf) {
        let canvas = document.createElement('canvas');
        let w = imgWind.naturalWidth;
        let h = imgWind.naturalHeight;
        canvas.width = w;
        canvas.height = h;
        let ctxSrc = canvas.getContext('2d');
        ctxSrc.drawImage(imgWind, 0, 0);
        let windData = ctxSrc.getImageData(0, 0, w, h).data;
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                let i = (y * w + x) * 4;
                // Get R channel from src. We only use the single channel
                // because assume src img is grayscale.
                let p = windData[i];
                // Now set the B channel of the buffer we're writing to
                buf[i + 2] = p;
            }
        }
    }
};
