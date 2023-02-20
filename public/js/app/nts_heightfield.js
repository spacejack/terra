
// USES:
// NTS_GMATH
// NTS_VEC

// USED IN:
// NTS_PLAYER_C
// NTS_WORLD_C

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// Untypescript 2023 by Kearnan Kelly

"use strict";

let NTS_HEIGHTFIELD = {

    Heightfield: function (info) {
        var hf = {
            cellSize: (info.cellSize && info.cellSize > 0) ? info.cellSize : 1.0,
            minHeight: (typeof info.minHeight === 'number') ? info.minHeight : 0.0,
            maxHeight: (typeof info.maxHeight === 'number') ? info.maxHeight : 1.0,
            xCount: 0,
            yCount: 0,
            xSize: 0,
            ySize: 0,
            heights: new Float32Array(0),
            faceNormals: new Float32Array(0),
            vtxNormals: new Float32Array(0)
        };
        if (info.image) {
            this.genFromImg(info.image, hf);
        } else {
            hf.xCount = info.xCount && info.xCount > 0 ? Math.floor(info.xCount) : 1;
            hf.yCount = info.yCount && info.yCount > 0 ? Math.floor(info.yCount) : 1;
            hf.xSize = hf.xCount * hf.cellSize;
            hf.ySize = info.yCount * hf.cellSize;
            hf.heights = info.heights || new Float32Array((hf.xCount + 1) * (hf.yCount + 1));
            // 2 normals per cell (quad)
            hf.faceNormals = new Float32Array(3 * 2 * hf.xCount * hf.yCount);
            hf.vtxNormals = new Float32Array(3 * (hf.xCount + 1) * (hf.yCount + 1));
            calcFaceNormals(hf);
        }
        return hf;
    },

    HInfo: function () {
        return {
            i: 0, t: 0, z: 0.0, n: NTS_VEC.Vec3.create()
        };
    },

    genFromImg: function (image, hf) {

        var x, y, i, height;
        var w = image.width, h = image.height, heightRange = hf.maxHeight - hf.minHeight;
        hf.xCount = w - 1;
        hf.yCount = h - 1;
        hf.xSize = hf.xCount * hf.cellSize;
        hf.ySize = hf.yCount * hf.cellSize;
        // Draw to a canvas so we can get the data
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, w, h);
        // array of canvas pixel data [r,g,b,a, r,g,b,a, ...]
        var data = ctx.getImageData(0, 0, w, h).data;
        var heights = new Float32Array(w * h);
        for (y = 0; y < h; ++y) {
            for (x = 0; x < w; ++x) {
                // flip vertical because textures are Y+
                i = (x + (h - y - 1) * w) * 4;
                //i = (x + y * w) * 4
                // normalized altitude value (0-1)
                // assume image is grayscale, so we only need 1 color component
                height = data[i] / 255.0;
                //height = (data[i+0] + data[i+1] + data[i+2]) / (255+255+255)
                //  scale & store this altitude
                heights[x + y * w] = hf.minHeight + height * heightRange;
            }
        }
        // Free these resources soon as possible
        data = ctx = canvas = null;
        hf.heights = heights;
        // 2 normals per cell (quad)
        hf.faceNormals = new Float32Array(3 * 2 * hf.xCount * hf.yCount);
        hf.vtxNormals = new Float32Array(3 * (hf.xCount + 1) * (hf.yCount + 1));
        this.calcFaceNormals(hf);
        this.calcVertexNormals(hf);
    },

    calcFaceNormals: function (hf) {
        var csz = hf.cellSize, xc = hf.xCount, // tile X & Y counts
              yc = hf.yCount, hxc = hf.xCount + 1, // height X count (1 larger than tile count)
              heights = hf.heights, // 1 less indirection
              normals = hf.faceNormals, v0 = NTS_VEC.Vec3.create(), v1 = NTS_VEC.Vec3.create(), n = NTS_VEC.Vec3.create(); // used to compute normals
        var i = 0;
        var tStart = Date.now();
        for (var iy = 0; iy < yc; ++iy) {
            for (var ix = 0; ix < xc; ++ix) {
                i = 6 * (ix + iy * xc);
                var ih = ix + iy * hxc;
                var z = heights[ih];
                // 2 vectors of top-left tri
                v0.x = csz;
                v0.y = csz;
                v0.z = heights[ih + hxc + 1] - z;
                v1.x = 0.0;
                v1.y = csz;
                v1.z = heights[ih + hxc] - z;
                NTS_VEC.Vec3.cross(v0, v1, n);
                NTS_VEC.Vec3.normalize(n, n);
                normals[i + 0] = n.x;
                normals[i + 1] = n.y;
                normals[i + 2] = n.z;
                // 2 vectors of bottom-right tri
                v0.x = csz;
                v0.y = 0.0;
                v0.z = heights[ih + 1] - z;
                v1.x = csz;
                v1.y = csz;
                v1.z = heights[ih + hxc + 1] - z;
                NTS_VEC.Vec3.cross(v0, v1, n);
                NTS_VEC.Vec3.normalize(n, n);
                normals[i + 3] = n.x;
                normals[i + 4] = n.y;
                normals[i + 5] = n.z;
            }
        }
        var dt = Date.now() - tStart;
        console.log("computed ".concat(i, " heightfield face normals in ").concat(dt, "ms"));
    },

    calcVertexNormals: function (hf) {
        var vnorms = hf.vtxNormals;
        var w = hf.xCount + 1;
        var h = hf.yCount + 1;
        var n = NTS_VEC.Vec3.create();
        var i = 0;
        var tStart = Date.now();
        for (var y = 0; y < h; ++y) {
            for (var x = 0; x < w; ++x) {
                this.computeVertexNormal(hf, x, y, n);
                i = (y * w + x) * 3;
                vnorms[i++] = n.x;
                vnorms[i++] = n.y;
                vnorms[i++] = n.z;
            }
        }
        var dt = Date.now() - tStart;
        console.log("computed ".concat(w * h, " vertex normals in ").concat(dt, "ms"));
    },

    computeVertexNormal: function (hf, vx, vy, n) {
        var fnorms = hf.faceNormals;
        // This vertex is belongs to 4 quads
        // Do the faces this vertex is the 1st point of for this quad.
        // This is the quad up and to the right
        var qx = vx % hf.xCount;
        var qy = vy % hf.yCount;
        var ni = (qy * hf.xCount + qx) * 3 * 2;
        n.x = fnorms[ni + 0];
        n.y = fnorms[ni + 1];
        n.z = fnorms[ni + 2];
        ni += 3;
        n.x += fnorms[ni + 0];
        n.y += fnorms[ni + 1];
        n.z += fnorms[ni + 2];
        // 2nd tri of quad up and to the left
        qx = (0, NTS_GMATH.pmod)(qx - 1, hf.xCount);
        ni = (qy * hf.xCount + qx) * 3 * 2 + 3;
        n.x += fnorms[ni + 0];
        n.y += fnorms[ni + 1];
        n.z += fnorms[ni + 2];
        // both tris of quad down and to the left
        qy = (0, NTS_GMATH.pmod)(qy - 1, hf.yCount);
        ni = (qy * hf.xCount + qx) * 3 * 2;
        n.x += fnorms[ni + 0];
        n.y += fnorms[ni + 1];
        n.z += fnorms[ni + 2];
        ni += 3;
        n.x += fnorms[ni + 0];
        n.y += fnorms[ni + 1];
        n.z += fnorms[ni + 2];
        // 1st tri of quad down and to the right
        qx = (qx + 1) % hf.xCount;
        ni = (qy * hf.xCount + qx) * 3 * 2;
        n.x += fnorms[ni + 0];
        n.y += fnorms[ni + 1];
        n.z += fnorms[ni + 2];
        // Normalize to 'average' the result normal
        NTS_VEC.Vec3.normalize(n, n);
    },
    
    infoAt: function(hf, x, y, wrap, hi) {
        var ox = -(hf.xSize / 2.0); // bottom left of heightfield
        var oy = -(hf.ySize / 2.0);
        if (x < ox || x >= -ox || y < oy || y >= -oy) {
            if (!wrap) {
                // out of bounds
                hi.i = -1;
                hi.z = hf.minHeight;
                hi.n.x = hi.n.y = hi.n.z = 0;
                hi.t = 0;
                return;
            }
            // wrap around
            x = (0, NTS_GMATH.pmod)(x - ox, hf.xSize) + ox;
            y = (0, NTS_GMATH.pmod)(y - oy, hf.ySize) + oy;
        }
        var csz = hf.cellSize, normals = hf.faceNormals, n = hi.n, ix = Math.floor((x - ox) / csz), iy = Math.floor((y - oy) / csz), ih = ix + iy * (hf.xCount + 1), // height index
        px = (x - ox) % csz, // relative x,y within this quad
        py = (y - oy) % csz;
        var i = ix + iy * hf.xCount; // tile index
        if (py > 0 && px / py < 1.0) {
            // top left tri
            hi.t = 0;
            n.x = normals[i * 6 + 0];
            n.y = normals[i * 6 + 1];
            n.z = normals[i * 6 + 2];
        }
        else {
            // bottom right tri
            hi.t = 1;
            n.x = normals[i * 6 + 3];
            n.y = normals[i * 6 + 4];
            n.z = normals[i * 6 + 5];
        }
        hi.i = i;
        hi.z = this.getPlaneZ(n, hf.heights[ih], px, py);
    },
    
    _hi: null,
    
    heightAt: function(hf, x, y, wrap) {
        this._hi = this.HInfo();
        if (wrap === void 0) { wrap = false; }
        this.infoAt(hf, x, y, wrap, this._hi);
        return this._hi.z;
    },
    
    getPlaneZ: function(n, z0, x, y) {
        return z0 - (n.x * x + n.y * y) / n.z;
    }

};