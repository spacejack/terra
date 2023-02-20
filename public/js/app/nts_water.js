/*global THREE*/

// USES:
// THREE
// NTS_VEC

// USED IN:
// NTS_WORLD_C

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// Untypescript 2023 by Kearnan Kelly

"use strict";

// Water mesh
// A flat plane extending to frustum depth that follows
// viewer position horizontally.
// Shader does environmental mapping to reflect skydome,
// blend with water colour, and apply fog in distance.
// Uses water shaders (see: shader/water.*.glsl) 
let NTS_WATER = {
    
    _time: 0,

    // Create Water Mesh
    createMesh: function (opts) {
        
        opts.envMap.wrapS = opts.envMap.wrapT = THREE.RepeatWrapping;
        opts.envMap.minFilter = opts.envMap.magFilter = THREE.LinearFilter;
        opts.envMap.generateMipmaps = false;
        
        let mat = new THREE.RawShaderMaterial({
            uniforms: {
                time: {type: '1f', value: 0.0},
                viewPos: {type: '3f', value: [0.0, 0.0, 10.0]},
                map: {type: 't', value: opts.envMap},
                waterLevel: {type: '1f', value: opts.waterLevel},
                waterColor: {type: '3f', value: NTS_VEC.Color.toArray(opts.waterColor)},
                fogColor: {type: '3f', value: NTS_VEC.Color.toArray(opts.fogColor)},
                fogNear: {type: 'f', value: 1.0},
                fogFar: {type: 'f', value: opts.fogFar * 1.5}
            },
            vertexShader: opts.vertScript,
            fragmentShader: opts.fragScript
        });
        
        let mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000.0, 2000.0), mat);
        mesh.frustumCulled = false;
        
        this._time = Date.now();
        
        return mesh;
    },

    update: function (mesh, viewPos) {
        mesh.position.x = viewPos.x;
        mesh.position.y = viewPos.y;
        let mat = mesh.material;
        let vp = mat.uniforms['viewPos'].value;
        vp[0] = viewPos.x;
        vp[1] = viewPos.y;
        vp[2] = viewPos.z;
        mat.uniforms['time'].value = (Date.now() - this._time) / 250.0;
    }

};

