/*global THREE*/

// USES:
// THREE

// USED IN:
// NTS_WORLD_C

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// Untypescript 2023 by Kearnan Kelly

"use strict";

let NTS_SKYDOME = {

    createMesh: function (tex, radius, lats, lngs) {
        if (lats === void 0) {
            lats = 16;
        }
        if (lngs === void 0) {
            lngs = 32;
        }
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        return new THREE.Mesh(new THREE.SphereGeometry(radius, lngs, lats, 0, Math.PI * 2.0, 0, Math.PI / 2.0).rotateX(Math.PI / 2.0).rotateZ(Math.PI), new THREE.MeshBasicMaterial({
            color: 0xFFFFFF, side: THREE.BackSide, map: tex, fog: false
        }));
    }
    
};

              