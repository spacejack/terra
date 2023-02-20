/*global THREE*/

// USES:
// THREE
// NTS_UTIL
// NTS_GMATH
// NTS_VEC
// NTS_LOGGER
// NTS_INPUT
// NTS_SKYDOME
// NTS_HEIGHTFIELD
// NTS_GRASS
// NTS_TERRAIN
// NTS_TERRAMAP
// NTS_WATER
// NTS_FPS
// NTS_PLAYER_C

// USED IN:
// NTS_APP_C

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// Untypescript 2023 by Kearnan Kelly

"use strict";

class NTS_WORLD_C {
    
    // Create a World instance
    constructor(assets, numGrassBlades, grassPatchRadius, displayWidth, displayHeight, antialias) {
        this.util_1 = NTS_UTIL;
        this.gmath_1 = NTS_GMATH;
        this.vec_1 = NTS_VEC;
        this.logger = NTS_LOGGER;
        this.input = NTS_INPUT;
        this.skydome = NTS_SKYDOME;
        this.heightfield_2 = NTS_HEIGHTFIELD;
        this.grass = NTS_GRASS.init();
        this.terrain_1 = NTS_TERRAIN;
        this.terramap = NTS_TERRAMAP;
        this.water = NTS_WATER;
        this.fps_1 = NTS_FPS;
        this.GRASS_PITCH_RADIUS = grassPatchRadius;
        this.NUM_GRASS_BLADES = numGrassBlades;
        this.VIEW_DEPTH = 2000.0;
        this.MAX_TIMESTEP = 67; // max 67 ms/frame
        this.HEIGHTFIELD_SIZE = 3072.0;
        this.HEIGHTFIELD_HEIGHT = 180.0;
        this.WATER_LEVEL = this.HEIGHTFIELD_HEIGHT * 0.305556; // 55.0
        this.BEACH_TRANSITION_LOW = 0.31;
        this.BEACH_TRANSITION_HIGH = 0.36;

        this.LIGHT_DIR = this.vec_1.Vec3.create(0.0, 1.0, -1.0);
        this.vec_1.Vec3.normalize(this.LIGHT_DIR, this.LIGHT_DIR);

        this.FOG_COLOR = this.vec_1.Color.create(0.74, 0.77, 0.91);
        this.GRASS_COLOR = this.vec_1.Color.create(0.45, 0.46, 0.19);
        this.WATER_COLOR = this.vec_1.Color.create(0.6, 0.7, 0.85);
        this.WIND_DEFAULT = 1.5;
        this.WIND_MAX = 3.0;
        this.MAX_GLARE = 0.25; // max glare effect amount
        this.GLARE_RANGE = 1.1; // angular range of effect
        this.GLARE_YAW = Math.PI * 1.5; // yaw angle when looking directly at sun
        this.GLARE_PITCH = 0.2; // pitch angle looking at sun
        this.GLARE_COLOR = this.vec_1.Color.create(1.0, 0.8, 0.4);
        this.INTRO_FADE_DUR = 2000;


        this.canvas = this.util_1.$e('app_canvas');


        // Make canvas transparent so it isn't rendered as black for 1 frame at startup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas, antialias: antialias, clearColor: 0xFFFFFF, clearAlpha: 1, alpha: true
        });
        if (!this.renderer) {
            throw new Error("Failed to create THREE.WebGLRenderer");
        }


        // Setup some render values based on provided configs
        this.fogDist = this.GRASS_PITCH_RADIUS * 20.0;
        this.grassFogDist = this.GRASS_PITCH_RADIUS * 2.0;


        this.camera = new THREE.PerspectiveCamera(45, displayWidth / displayHeight, 1.0, this.VIEW_DEPTH);
        this.meshes = {
            terrain: null, grass: null, sky: null, water: null, sunFlare: null, fade: null
        };


        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(this.vec_1.Color.to24bit(this.FOG_COLOR), 0.1, this.fogDist);


        // Setup the camera so Z is up.
        // Then we have cartesian X,Y coordinates along ground plane.
        this.camera.rotation.order = "ZXY";
        this.camera.rotation.x = Math.PI * 0.5;
        this.camera.rotation.y = Math.PI * 0.5;
        this.camera.rotation.z = Math.PI;
        this.camera.up.set(0.0, 0.0, 1.0);


        // Put camera in an object so we can transform it normally
        this.camHolder = new THREE.Object3D();
        this.camHolder.rotation.order = "ZYX";
        this.camHolder.add(this.camera);
        this.scene.add(this.camHolder);


        // Setup heightfield
        this.hfImg = assets.images['heightmap'];
        this.hfCellSize = this.HEIGHTFIELD_SIZE / this.hfImg.width;
        this.heightMapScale = this.vec_1.Vec3.create(1.0 / this.HEIGHTFIELD_SIZE, 1.0 / this.HEIGHTFIELD_SIZE, this.HEIGHTFIELD_HEIGHT);
        this.heightField = this.heightfield_2.Heightfield({
            cellSize: this.hfCellSize,
            minHeight: 0.0,
            maxHeight: this.heightMapScale.z,
            image: this.hfImg
        });


        this.hfImg = undefined;


        this.terraMap = this.terramap.createTexture(this.heightField, this.LIGHT_DIR, assets.images['noise']);
        this.windIntensity = this.WIND_DEFAULT;


        // Create a large patch of grass to fill the foreground
        this.meshes.grass = this.grass.createMesh({
            lightDir: this.LIGHT_DIR,
            numBlades: this.NUM_GRASS_BLADES,
            radius: this.GRASS_PITCH_RADIUS,
            texture: assets.textures['grass'],
            vertScript: assets.text['grass.vert'],
            fragScript: assets.text['grass.frag'],
            heightMap: this.terraMap,
            heightMapScale: this.heightMapScale,
            fogColor: this.FOG_COLOR,
            fogFar: this.fogDist,
            grassFogFar: this.grassFogDist,
            grassColor: this.GRASS_COLOR,
            transitionLow: this.BEACH_TRANSITION_LOW,
            transitionHigh: this.BEACH_TRANSITION_HIGH,
            windIntensity: this.windIntensity
        });
        // Set a specific render order - don't let three.js sort things for us.
        this.meshes.grass.renderOrder = 10;
        this.scene.add(this.meshes.grass);


        // Terrain mesh
        this.terra = this.terrain_1.Terrain({
            textures: [assets.textures['terrain1'], assets.textures['terrain2']],
            vertScript: assets.text['terrain.vert'],
            fragScript: assets.text['terrain.frag'],
            heightMap: this.terraMap,
            heightMapScale: this.heightMapScale,
            fogColor: this.FOG_COLOR,
            fogFar: this.fogDist,
            grassFogFar: this.grassFogDist,
            transitionLow: this.BEACH_TRANSITION_LOW,
            transitionHigh: this.BEACH_TRANSITION_HIGH
        });


        this.meshes.terrain = this.terra.mesh;
        this.meshes.terrain.renderOrder = 20;
        this.scene.add(this.meshes.terrain);


        // skydome and water
        this.meshes.sky = this.skydome.createMesh(assets.textures['skydome'], this.VIEW_DEPTH * 0.95);
        this.meshes.sky.renderOrder = 30;
        this.scene.add(this.meshes.sky);
        this.meshes.sky.position.z = -25.0;
        this.meshes.water = this.water.createMesh({
            envMap: assets.textures['skyenv'],
            vertScript: assets.text['water.vert'],
            fragScript: assets.text['water.frag'],
            waterLevel: this.WATER_LEVEL,
            waterColor: this.WATER_COLOR,
            fogColor: this.FOG_COLOR,
            fogNear: 1.0,
            fogFar: this.fogDist
        });
        this.meshes.water.renderOrder = 40;
        this.scene.add(this.meshes.water);
        this.meshes.water.position.z = this.WATER_LEVEL;


        // White plane to cover screen for fullscreen fade-in from white
        this.meshes.fade = new THREE.Mesh(new THREE.PlaneBufferGeometry(6.0, 4.0, 1, 1), new THREE.MeshBasicMaterial({
            color: 0xFFFFFF, fog: false, transparent: true, opacity: 1.0,
            depthTest: false, depthWrite: false
        }));
        this.meshes.fade.position.x = 2.0; // place directly in front of camera
        this.meshes.fade.rotation.y = Math.PI * 1.5;
        this.meshes.fade.renderOrder = 10;
        this.camHolder.add(this.meshes.fade);
        this.camHolder.renderOrder = 100;


        // Bright yellow plane for sun glare using additive blending
        // to blow out the colours
        this.meshes.sunFlare = new THREE.Mesh(new THREE.PlaneBufferGeometry(6.0, 4.0, 1, 1), new THREE.MeshBasicMaterial({
            color: this.vec_1.Color.to24bit(this.GLARE_COLOR), fog: false, transparent: true, opacity: 0.0,
            depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending
        }));
        this.meshes.sunFlare.position.x = 2.05;
        this.meshes.sunFlare.rotation.y = Math.PI * 1.5;
        this.meshes.sunFlare.visible = false;
        this.meshes.sunFlare.renderOrder = 20;
        this.camHolder.add(this.meshes.sunFlare);


        // Create a Player instance
        this.player = new NTS_PLAYER_C(this.heightField, this.WATER_LEVEL);

        // For timing
        this.prevT = Date.now(); // prev frame time (ms)
        this.simT = 0; // total running time (ms)
        this.resize(displayWidth, displayHeight);


        // toggle logger on ` press
        this.input.setKeyPressListener(192, function () {
            this.logger.toggle();
        }.bind(this));

        this.input.setKeyPressListener('O'.charCodeAt(0), function () {
            this.player.state.pos.x = 0;
            this.player.state.pos.y = 0;
        }.bind(this));

        this.input.setKeyPressListener('F'.charCodeAt(0), function () {
            this.windIntensity = Math.max(this.windIntensity - 0.1, 0);
            let mat = this.meshes.grass.material;
            mat.uniforms['windIntensity'].value = this.windIntensity;
        }.bind(this));

        this.input.setKeyPressListener('G'.charCodeAt(0), function () {
            this.windIntensity = Math.min(this.windIntensity + 0.1, this.WIND_MAX);
            let mat = this.meshes.grass.material;
            mat.uniforms['windIntensity'].value = this.windIntensity;
        }.bind(this));

        this.fpsMon = this.fps_1.FPSMonitor();

        this._hinfo = this.heightfield_2.HInfo();
        this._v = this.vec_1.Vec2.create(0.0, 0.0);
    }

    // Call every frame

    doFrame() {
        let curT = Date.now();
        let dt = curT - this.prevT;

        this.fpsMon.update(dt);

        if (dt > 0) {
            // only do computations if time elapsed
            if (dt > this.MAX_TIMESTEP) {
                // don't exceed max timestep
                dt = this.MAX_TIMESTEP;
                this.prevT = curT - this.MAX_TIMESTEP;
            }
            // update sim
            this.update(dt);
            // render it
            this.render();
            // remember prev frame time
            this.prevT = curT;
        }
    }

    // Handle window resize events
    resize(w, h) {
        this.displayWidth = w;
        this.displayHeight = h;
        this.renderer.setSize(this.displayWidth, this.displayHeight);
        this.camera.aspect = this.displayWidth / this.displayHeight;
        this.camera.updateProjectionMatrix();
    }

    // Logic update
    update(dt) {
        // Intro fade from white
        if (this.simT < this.INTRO_FADE_DUR) {
            this.updateFade(dt);
        }

        this.simT += dt;

        let t = this.simT * 0.001;

        // Move player (viewer)
        this.player.update(dt);

        let ppos = this.player.state.pos;
        let pdir = this.player.state.dir;
        let pyaw = this.player.state.yaw;
        let ppitch = this.player.state.pitch;
        let proll = this.player.state.roll;

        this.heightfield_2.infoAt(this.heightField, ppos.x, ppos.y, true, this._hinfo);

        let groundHeight = this._hinfo.z;

        if (this.logger.isVisible()) {
            this.logger.setText("x:" + ppos.x.toFixed(4) +
                  " y:" + ppos.y.toFixed(4) +
                  " z:" + ppos.z.toFixed(4) +
                  " dx:" + pdir.x.toFixed(4) +
                  " dy:" + pdir.y.toFixed(4) +
                  " dz:" + pdir.z.toFixed(4) +
                  " height:" + groundHeight.toFixed(4) +
                  " i:" + this._hinfo.i +
                  " fps:" + this.fpsMon.fps());
        }

        // Move skydome with player
        this.meshes.sky.position.x = ppos.x;
        this.meshes.sky.position.y = ppos.y;

        // Update grass.
        // Here we specify the centre position of the square patch to
        // be drawn. That would be directly in front of the camera, the
        // distance from centre to edge of the patch.
        let drawPos = this._v;
        this.vec_1.Vec2.set(drawPos, ppos.x + Math.cos(pyaw) * this.GRASS_PITCH_RADIUS, ppos.y + Math.sin(pyaw) * this.GRASS_PITCH_RADIUS);
        this.grass.update(this.meshes.grass, t, ppos, pdir, drawPos);
        this.terrain_1.update(this.terra, ppos.x, ppos.y);
        this.water.update(this.meshes.water, ppos);

        // Update camera location/orientation
        this.vec_1.Vec3.copy(ppos, this.camHolder.position);

        //camHolder.position.z = ppos.z + groundHeight
        this.camHolder.rotation.z = pyaw;

        // Player considers 'up' pitch positive, but cam pitch (about Y) is reversed
        this.camHolder.rotation.y = -ppitch;
        this.camHolder.rotation.x = proll;

        // Update sun glare effect
        this.updateGlare();
    }

    // Update how much glare effect by how much we're looking at the sun
    updateGlare() {
        let dy = Math.abs(this.gmath_1.difAngle(this.GLARE_YAW, this.player.state.yaw));
        let dp = Math.abs(this.gmath_1.difAngle(this.GLARE_PITCH, this.player.state.pitch)) * 1.75;
        let sunVisAngle = Math.sqrt(dy * dy + dp * dp);
        if (sunVisAngle < this.GLARE_RANGE) {
            let glare = this.MAX_GLARE * Math.pow((this.GLARE_RANGE - sunVisAngle) / (1.0 + this.MAX_GLARE), 0.75);
            this.meshes.sunFlare.material.opacity = Math.max(0.0, glare);
            this.meshes.sunFlare.visible = true;
        } else {
            this.meshes.sunFlare.visible = false;
        }
    }

    // Update intro fullscreen fade from white
    updateFade(dt) {
        let mat = this.meshes.fade.material;
        if (this.simT + dt >= this.INTRO_FADE_DUR) {
            // fade is complete - hide cover
            mat.opacity = 0.0;
            this.meshes.fade.visible = false;
        } else {
            // update fade opacity
            mat.opacity = 1.0 - Math.pow(this.simT / this.INTRO_FADE_DUR, 2.0);
        }
    }
    
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    // Return public interface
    //    return {
    //        doFrame: doFrame,
    //        resize: resize
    //    };

}
         