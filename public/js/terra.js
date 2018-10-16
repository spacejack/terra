(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
// Simple CSS animations
//
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
var gmath_1 = require("./gmath");
var PRECISION = 5;
/**
 * Fades element from o0 opacity to o1 opacity in dur milliseconds.
 * Invokes complete callback when done.
 */
function fade(el, o0, o1, dur, complete) {
    var startT = Date.now();
    var prevO = gmath_1.roundFrac(o0, PRECISION).toString();
    el.style.opacity = prevO;
    function fadeLoop() {
        var t = Date.now() - startT;
        if (t >= dur) {
            el.style.opacity = gmath_1.roundFrac(o1, PRECISION).toString();
            if (complete)
                complete();
        }
        else {
            // round off so style value isn't too weird
            var o = gmath_1.roundFrac(o0 + t / dur * (o1 - o0), PRECISION).toString();
            if (o !== prevO) {
                // only update style if value has changed
                el.style.opacity = o;
                prevO = o;
            }
            requestAnimationFrame(fadeLoop);
        }
    }
    requestAnimationFrame(fadeLoop);
}
exports.fade = fade;
/**
 * Go from 0 opacity to 1 in dur milliseconds.
 * @param el Element to fade
 * @param dur Fade duration in ms
 * @param complete Callback on complete
 */
function fadeIn(el, dur, complete) {
    fade(el, 0, 1, dur, complete);
}
exports.fadeIn = fadeIn;
/**
 * Go from 1 opacity to 0 in dur milliseconds.
 * @param el Element to fade
 * @param dur Fade duration in ms
 * @param complete Callback on complete
 */
function fadeOut(el, dur, complete) {
    fade(el, 1, 0, dur, complete);
}
exports.fadeOut = fadeOut;

},{"./gmath":6}],2:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var loader_1 = __importDefault(require("./loader"));
var input = __importStar(require("./input"));
var anim = __importStar(require("./anim"));
var fullscreen = __importStar(require("./fullscreen"));
var browser = __importStar(require("./browser"));
var world_1 = __importDefault(require("./world"));
// circa 2016
var CONFIGS = {
    mobile: { blades: 20000, depth: 50.0, antialias: false },
    laptop: { blades: 40000, depth: 65.0, antialias: false },
    desktop: { blades: 84000, depth: 85.0, antialias: true },
    desktop2: { blades: 250000, depth: 125.0, antialias: true },
    gamerig: { blades: 500000, depth: 175.0, antialias: true }
};
/**
 * Create App instance
 */
function App() {
    // DOM element containing canvas
    var container = util_1.$e('app_canvas_container');
    // Will be set correctly later
    var displayWidth = 640;
    var displayHeight = 480;
    var assets;
    var world;
    var isFullscreen = fullscreen.is();
    /**
     *  Call this when HTML page elements are loaded & ready
     */
    function run() {
        if (!util_1.$e('app_canvas_container')) {
            console.error("app_canvas_container element not found in page");
            return false;
        }
        if (!util_1.detectWebGL()) {
            util_1.$e('loading_text').textContent = "WebGL unavailable.";
            return false;
        }
        resize();
        loadAssets();
        configUI();
        window.addEventListener('resize', resize, false);
        return true;
    }
    /**
     * Configuration UI input handlers
     */
    function configUI() {
        // Select a config roughly based on device type
        var cfgId = browser.isMobile.any ? 'mobile' : 'desktop';
        var cfg = CONFIGS[cfgId];
        var sel = util_1.$i('sel_devicepower');
        sel.value = cfgId;
        var inp_blades = util_1.$i('inp_blades');
        inp_blades.value = cfg.blades.toString();
        var inp_depth = util_1.$i('inp_depth');
        inp_depth.value = cfg.depth.toString();
        util_1.$i('chk_antialias').checked = cfg.antialias;
        util_1.$i('chk_fullscreen').checked = false;
        util_1.$i('chk_fullscreen').onchange = function () {
            fullscreen.toggle(util_1.$e('app_container'));
        };
        sel.onchange = function (e) {
            var cfg = CONFIGS[sel.value];
            var b = cfg.blades.toString();
            var d = cfg.depth.toString();
            inp_blades.value = b;
            inp_depth.value = d;
            util_1.$e('txt_blades').textContent = b;
            util_1.$e('txt_depth').textContent = d;
            util_1.$i('chk_antialias').checked = cfg.antialias;
        };
        util_1.$e('txt_blades').textContent = cfg.blades.toString();
        util_1.$e('txt_depth').textContent = cfg.depth.toString();
        inp_blades.onchange = function (e) {
            util_1.$e('txt_blades').textContent = inp_blades.value;
        };
        inp_depth.onchange = function (e) {
            util_1.$e('txt_depth').textContent = inp_depth.value;
        };
    }
    function loadAssets() {
        var loader = loader_1.default();
        loader.load({
            text: [
                { name: 'grass.vert', url: 'shader/grass.vert.glsl' },
                { name: 'grass.frag', url: 'shader/grass.frag.glsl' },
                { name: 'terrain.vert', url: 'shader/terrain.vert.glsl' },
                { name: 'terrain.frag', url: 'shader/terrain.frag.glsl' },
                { name: 'water.vert', url: 'shader/water.vert.glsl' },
                { name: 'water.frag', url: 'shader/water.frag.glsl' }
            ],
            images: [
                { name: 'heightmap', url: 'data/heightmap.jpg' },
                { name: 'noise', url: 'data/noise.jpg' }
            ],
            textures: [
                { name: 'grass', url: 'data/grass.jpg' },
                { name: 'terrain1', url: 'data/terrain1.jpg' },
                { name: 'terrain2', url: 'data/terrain2.jpg' },
                { name: 'skydome', url: 'data/skydome.jpg' },
                { name: 'skyenv', url: 'data/skyenv.jpg' }
            ]
        }, onAssetsLoaded, onAssetsProgress, onAssetsError);
    }
    function onAssetsProgress(p) {
        var pct = Math.floor(p * 90);
        util_1.$e('loading_bar').style.width = pct + '%';
    }
    function onAssetsError(e) {
        util_1.$e('loading_text').textContent = e;
    }
    function onAssetsLoaded(a) {
        assets = a;
        util_1.$e('loading_bar').style.width = '100%';
        util_1.$e('loading_text').innerHTML = "&nbsp;";
        setTimeout(function () {
            util_1.$e('loading_bar_outer').style.visibility = 'hidden';
            util_1.$e('config_block').style.visibility = 'visible';
            util_1.$e('btn_start').onclick = function () {
                anim.fadeOut(util_1.$e('loading_block'), 80, function () {
                    util_1.$e('loading_block').style.display = 'none';
                    if (!isFullscreen) {
                        util_1.$e('title_bar').style.display = 'block';
                    }
                    util_1.$e('btn_fullscreen').onclick = function () {
                        fullscreen.toggle(util_1.$e('app_container'));
                    };
                    util_1.$e('btn_restart').onclick = function () {
                        document.location.reload();
                    };
                    start();
                });
            };
        }, 10);
    }
    /**
     *  All stuff loaded, setup event handlers & start the app...
     */
    function start() {
        if (util_1.$i('chk_audio').checked) {
            var au = util_1.$e('chopin');
            au.loop = true;
            au.play();
        }
        input.init();
        // Get detail settings from UI inputs
        var numGrassBlades = +(util_1.$i('inp_blades').value);
        var grassPatchRadius = +(util_1.$i('inp_depth').value);
        var antialias = !!(util_1.$i('chk_antialias').checked);
        // Create an instance of the world
        world = world_1.default(assets, numGrassBlades, grassPatchRadius, displayWidth, displayHeight, antialias);
        // Start our animation loop
        doFrame();
    }
    function doFrame() {
        // keep animation loop running
        world.doFrame();
        requestAnimationFrame(doFrame);
    }
    /** Handle window resize events */
    function resize() {
        displayWidth = container.clientWidth;
        displayHeight = container.clientHeight;
        if (world) {
            world.resize(displayWidth, displayHeight);
        }
        else {
            var canvas = util_1.$e('app_canvas');
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
        // Seems to be a good place to check for fullscreen toggle.
        var fs = fullscreen.is();
        if (fs !== isFullscreen) {
            // Show/hide the UI when switching windowed/FS mode.
            util_1.$e('title_bar').style.display = fs ? 'none' : 'block';
            isFullscreen = fs;
        }
    }
    //  Return public interface
    return {
        run: run
    };
}
exports.default = App;

},{"./anim":1,"./browser":3,"./fullscreen":5,"./input":9,"./loader":10,"./util":19,"./world":22}],3:[function(require,module,exports){
"use strict";
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
/** Try to determine if was launched from homescreen/desktop app launcher */
exports.isStandalone = (function () {
    // iOS
    if (navigator.standalone !== undefined)
        return !!navigator.standalone;
    // Windows Mobile
    if (window.external && window.external.msIsSiteMode)
        return !!window.external.msIsSiteMode();
    // Chrome
    return window.matchMedia('(display-mode: standalone)').matches;
}());
exports.isMobile = (function () {
    var a = !!navigator.userAgent.match(/Android/i);
    var bb = !!navigator.userAgent.match(/BlackBerry/i);
    var ios = !!navigator.userAgent.match(/iPhone|iPad|iPod/i);
    var o = !!navigator.userAgent.match(/Opera Mini/i);
    var w = !!navigator.userAgent.match(/IEMobile/i);
    var ff = !!navigator.userAgent.match(/\(Mobile/i);
    var any = (a || bb || ios || o || w || ff);
    return {
        Android: a,
        BlackBerry: bb,
        iOS: ios,
        Opera: o,
        Windows: w,
        FireFox: ff,
        any: any
    };
}());

},{}],4:[function(require,module,exports){
"use strict";
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Create instance of Frames Per Second Monitor
 */
function FPSMonitor(num) {
    if (num === void 0) { num = 16; }
    var ticks = new Array(num);
    var sum = 0;
    var index = 0;
    var f = 60.0; // frames per sec initial assumption
    for (var i = 0; i < num; ++i) {
        ticks[i] = 16.66666667;
        sum += 16.66666667;
    }
    /**
     *  Update with new sample
     *  @return New average frames/second
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
exports.default = FPSMonitor;

},{}],5:[function(require,module,exports){
"use strict";
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
function toggle(el) {
    if (!is()) {
        /*if (document.mozFullscreenEnabled === false) {
            console.warn("Fullscreen may not be available")
        }*/
        if (el.requestFullscreen) {
            el.requestFullscreen();
        }
        else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        }
        else if (el.mozRequestFullScreen) {
            el.mozRequestFullScreen();
        }
        else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        }
    }
    else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
        else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}
exports.toggle = toggle;
function is() {
    return !!document.fullscreenElement || !!document.mozFullScreenElement ||
        !!document.webkitFullscreenElement || !!document.msFullscreenElement;
}
exports.is = is;

},{}],6:[function(require,module,exports){
"use strict";
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
exports.PI2 = Math.PI * 2.0;
function sign(n) {
    return (n > 0 ? 1 : n < 0 ? -1 : 0);
}
exports.sign = sign;
function roundFrac(n, places) {
    var d = Math.pow(10, places);
    return Math.round((n + 0.000000001) * d) / d;
}
exports.roundFrac = roundFrac;
function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
}
exports.clamp = clamp;
/**  Always positive modulus */
function pmod(n, m) {
    return ((n % m + m) % m);
}
exports.pmod = pmod;
/** A random number from -1.0 to 1.0 */
function nrand() {
    return Math.random() * 2.0 - 1.0;
}
exports.nrand = nrand;
function angle(x, y) {
    return pmod(Math.atan2(y, x), exports.PI2);
}
exports.angle = angle;
function difAngle(a0, a1) {
    var r = pmod(a1, exports.PI2) - pmod(a0, exports.PI2);
    return Math.abs(r) < Math.PI ? r : r - exports.PI2 * sign(r);
}
exports.difAngle = difAngle;
function dot(x0, y0, x1, y1) {
    return (x0 * x1 + y0 * y1);
}
exports.dot = dot;

},{}],7:[function(require,module,exports){
"use strict";
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Creates & animates a large patch of grass to fill the foreground.
// One simple blade of grass mesh is repeated many times using instanced arrays.
// Uses grass shaders (see: shader/grass.*.glsl)
/// <reference path="types/three-global.d.ts" />
var gmath_1 = require("./gmath");
var vec_1 = require("./vec");
var simplex_1 = __importDefault(require("./simplex"));
var BLADE_SEGS = 4; // # of blade segments
var BLADE_VERTS = (BLADE_SEGS + 1) * 2; // # of vertices per blade (1 side)
var BLADE_INDICES = BLADE_SEGS * 12;
var BLADE_WIDTH = 0.15;
var BLADE_HEIGHT_MIN = 2.25;
var BLADE_HEIGHT_MAX = 3.0;
/**
 * Creates a patch of grass mesh.
 */
function createMesh(opts) {
    // Buffers to use for instances of blade mesh
    var buffers = {
        // Tells the shader which vertex of the blade its working on.
        // Rather than supplying positions, they are computed from this vindex.
        vindex: new Float32Array(BLADE_VERTS * 2 * 1),
        // Shape properties of all blades
        shape: new Float32Array(4 * opts.numBlades),
        // Positon & rotation of all blades
        offset: new Float32Array(4 * opts.numBlades),
        // Indices for a blade
        index: new Uint16Array(BLADE_INDICES)
    };
    initBladeIndices(buffers.index, 0, BLADE_VERTS, 0);
    initBladeOffsetVerts(buffers.offset, opts.numBlades, opts.radius);
    initBladeShapeVerts(buffers.shape, opts.numBlades, buffers.offset);
    initBladeIndexVerts(buffers.vindex);
    var geo = new THREE.InstancedBufferGeometry();
    // Because there are no position vertices, we must create our own bounding sphere.
    // (Not used because we disable frustum culling)
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Math.sqrt(opts.radius * opts.radius * 2.0) * 10000.0);
    geo.addAttribute('vindex', new THREE.BufferAttribute(buffers.vindex, 1));
    geo.addAttribute('shape', new THREE.InstancedBufferAttribute(buffers.shape, 4));
    geo.addAttribute('offset', new THREE.InstancedBufferAttribute(buffers.offset, 4));
    geo.setIndex(new THREE.BufferAttribute(buffers.index, 1));
    var tex = opts.texture;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    var htex = opts.heightMap;
    htex.wrapS = htex.wrapT = THREE.RepeatWrapping;
    var hscale = opts.heightMapScale;
    var lightDir = vec_1.Vec3.clone(opts.lightDir);
    lightDir.z *= 0.5;
    vec_1.Vec3.normalize(lightDir, lightDir);
    // Fill in some constants that never change between draw calls
    var vertScript = opts.vertScript.replace('%%BLADE_HEIGHT_TALL%%', (BLADE_HEIGHT_MAX * 1.5).toFixed(1)).replace('%%BLADE_SEGS%%', BLADE_SEGS.toFixed(1)).replace('%%PATCH_SIZE%%', (opts.radius * 2.0).toFixed(1)).replace('%%TRANSITION_LOW%%', opts.transitionLow.toString()).replace('%%TRANSITION_HIGH%%', opts.transitionHigh.toString());
    // Setup shader
    var mat = new THREE.RawShaderMaterial({
        uniforms: {
            lightDir: { type: '3f', value: vec_1.Vec3.toArray(lightDir) },
            time: { type: 'f', value: 0.0 },
            map: { type: 't', value: tex },
            heightMap: { type: 't', value: htex },
            heightMapScale: { type: '3f', value: [hscale.x, hscale.y, hscale.z] },
            camDir: { type: '3f', value: [1.0, 0.0, 0.0] },
            drawPos: { type: '2f', value: [100.0, 0.0] },
            fogColor: { type: '3f', value: vec_1.Color.toArray(opts.fogColor) },
            fogNear: { type: 'f', value: 1.0 },
            fogFar: { type: 'f', value: opts.fogFar },
            grassColor: { type: '3f', value: vec_1.Color.toArray(opts.grassColor) },
            grassFogFar: { type: 'f', value: opts.grassFogFar },
            windIntensity: { type: 'f', value: opts.windIntensity }
        },
        vertexShader: vertScript,
        fragmentShader: opts.fragScript,
        transparent: true
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false; // always draw, never cull
    return mesh;
}
exports.createMesh = createMesh;
/**
 * Sets up indices for single blade mesh.
 * @param id array of indices
 * @param vc1 vertex start offset for front side of blade
 * @param vc2 vertex start offset for back side of blade
 * @param i index offset
 */
function initBladeIndices(id, vc1, vc2, i) {
    var seg;
    // blade front side
    for (seg = 0; seg < BLADE_SEGS; ++seg) {
        id[i++] = vc1 + 0; // tri 1
        id[i++] = vc1 + 1;
        id[i++] = vc1 + 2;
        id[i++] = vc1 + 2; // tri 2
        id[i++] = vc1 + 1;
        id[i++] = vc1 + 3;
        vc1 += 2;
    }
    // blade back side
    for (seg = 0; seg < BLADE_SEGS; ++seg) {
        id[i++] = vc2 + 2; // tri 1
        id[i++] = vc2 + 1;
        id[i++] = vc2 + 0;
        id[i++] = vc2 + 3; // tri 2
        id[i++] = vc2 + 1;
        id[i++] = vc2 + 2;
        vc2 += 2;
    }
}
/** Set up shape variations for each blade of grass */
function initBladeShapeVerts(shape, numBlades, offset) {
    var noise = 0;
    for (var i = 0; i < numBlades; ++i) {
        noise = Math.abs(simplex_1.default(offset[i * 4 + 0] * 0.03, offset[i * 4 + 1] * 0.03));
        noise = noise * noise * noise;
        noise *= 5.0;
        shape[i * 4 + 0] = BLADE_WIDTH + Math.random() * BLADE_WIDTH * 0.5; // width
        shape[i * 4 + 1] = BLADE_HEIGHT_MIN + Math.pow(Math.random(), 4.0) * (BLADE_HEIGHT_MAX - BLADE_HEIGHT_MIN) + // height
            noise;
        shape[i * 4 + 2] = 0.0 + Math.random() * 0.3; // lean
        shape[i * 4 + 3] = 0.05 + Math.random() * 0.3; // curve
    }
}
/** Set up positons & rotation for each blade of grass */
function initBladeOffsetVerts(offset, numBlades, patchRadius) {
    for (var i = 0; i < numBlades; ++i) {
        offset[i * 4 + 0] = gmath_1.nrand() * patchRadius; // x
        offset[i * 4 + 1] = gmath_1.nrand() * patchRadius; // y
        offset[i * 4 + 2] = 0.0; // z
        offset[i * 4 + 3] = Math.PI * 2.0 * Math.random(); // rot
    }
}
/** Set up indices for 1 blade */
function initBladeIndexVerts(vindex) {
    for (var i = 0; i < vindex.length; ++i) {
        vindex[i] = i;
    }
}
/**
 * Call each frame to animate grass blades.
 * @param mesh The patch of grass mesh returned from createMesh
 * @param time Time in seconds
 * @param x X coordinate of centre position to draw at
 * @param y Y coord
 */
function update(mesh, time, camPos, camDir, drawPos) {
    var mat = mesh.material;
    mat.uniforms['time'].value = time;
    var p = mat.uniforms['camDir'].value;
    p[0] = camDir.x;
    p[1] = camDir.y;
    p[2] = camDir.z;
    p = mat.uniforms['drawPos'].value;
    p[0] = drawPos.x;
    p[1] = drawPos.y;
}
exports.update = update;

},{"./gmath":6,"./simplex":15,"./vec":20}],8:[function(require,module,exports){
"use strict";
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
var gmath_1 = require("./gmath");
var vec_1 = require("./vec");
function HInfo() {
    return {
        i: 0, t: 0, z: 0.0, n: vec_1.Vec3.create()
    };
}
exports.HInfo = HInfo;
/**
 * Create a Heightfield using the given options.
 * Use either an image OR xCount, yCount and a heights array.
 */
function Heightfield(info) {
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
        genFromImg(info.image, hf);
    }
    else {
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
}
(function (Heightfield) {
    /**
     * Get heightfield info at point x,y. Outputs to hi.
     * @param wrap If true, x,y coords will be wrapped around if out of bounds,
     *             otherwise minHeight returned.
     * @param hi Struct to output result into.
     */
    function infoAt(hf, x, y, wrap, hi) {
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
            x = gmath_1.pmod(x - ox, hf.xSize) + ox;
            y = gmath_1.pmod(y - oy, hf.ySize) + oy;
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
        hi.z = getPlaneZ(n, hf.heights[ih], px, py);
    }
    Heightfield.infoAt = infoAt;
    // pre-allocated scratchpad object
    var _hi = HInfo();
    /**
     * Get height (z) at x,y
     * @param wrap If true, x,y coords will be wrapped around if out of bounds,
     *             otherwise minHeight returned.
     */
    function heightAt(hf, x, y, wrap) {
        if (wrap === void 0) { wrap = false; }
        infoAt(hf, x, y, wrap, _hi);
        return _hi.z;
    }
    Heightfield.heightAt = heightAt;
    /**
     *  Given a plane with normal n and z=z0 at (x=0,y=0) find z at x,y.
     *  @param n Normal vector of the plane.
     *  @param z0 Height (z) coordinate of the plane at x=0,y=0.
     *  @param x X coordinate to find height (z) at.
     *  @param y Y coordinate to find height (z) at.
     */
    function getPlaneZ(n, z0, x, y) {
        return z0 - (n.x * x + n.y * y) / n.z;
    }
    Heightfield.getPlaneZ = getPlaneZ;
})(Heightfield || (Heightfield = {}));
exports.default = Heightfield;
// Internal helpers...
/**
 * Generate heightfield from bitmap data. Lighter pixel colours are higher.
 */
function genFromImg(image, hf) {
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
    calcFaceNormals(hf);
    calcVertexNormals(hf);
}
/**
 *  Calculate normals.
 *  2 face normals per quad (1 per tri)
 */
function calcFaceNormals(hf) {
    var csz = hf.cellSize, xc = hf.xCount, // tile X & Y counts
    yc = hf.yCount, hxc = hf.xCount + 1, // height X count (1 larger than tile count)
    heights = hf.heights, // 1 less indirection
    normals = hf.faceNormals, v0 = vec_1.Vec3.create(), v1 = vec_1.Vec3.create(), n = vec_1.Vec3.create(); // used to compute normals
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
            vec_1.Vec3.cross(v0, v1, n);
            vec_1.Vec3.normalize(n, n);
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
            vec_1.Vec3.cross(v0, v1, n);
            vec_1.Vec3.normalize(n, n);
            normals[i + 3] = n.x;
            normals[i + 4] = n.y;
            normals[i + 5] = n.z;
        }
    }
    var dt = Date.now() - tStart;
    console.log("computed " + i + " heightfield face normals in " + dt + "ms");
}
function calcVertexNormals(hf) {
    var vnorms = hf.vtxNormals;
    var w = hf.xCount + 1;
    var h = hf.yCount + 1;
    var n = vec_1.Vec3.create();
    var i = 0;
    var tStart = Date.now();
    for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x) {
            computeVertexNormal(hf, x, y, n);
            i = (y * w + x) * 3;
            vnorms[i++] = n.x;
            vnorms[i++] = n.y;
            vnorms[i++] = n.z;
        }
    }
    var dt = Date.now() - tStart;
    console.log("computed " + w * h + " vertex normals in " + dt + "ms");
}
/**
 * Compute a vertex normal by averaging the adjacent face normals.
 */
function computeVertexNormal(hf, vx, vy, n) {
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
    qx = gmath_1.pmod(qx - 1, hf.xCount);
    ni = (qy * hf.xCount + qx) * 3 * 2 + 3;
    n.x += fnorms[ni + 0];
    n.y += fnorms[ni + 1];
    n.z += fnorms[ni + 2];
    // both tris of quad down and to the left
    qy = gmath_1.pmod(qy - 1, hf.yCount);
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
    vec_1.Vec3.normalize(n, n);
}

},{"./gmath":6,"./vec":20}],9:[function(require,module,exports){
"use strict";
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
exports.state = {
    up: 0,
    down: 0,
    left: 0,
    right: 0,
    forward: 0,
    back: 0,
    pitchup: 0,
    pitchdown: 0
};
var keyStates = new Array(256).map(function (b) { return false; });
// Any listeners the app has set up
var keyPressListeners = {};
function setState(k, s) {
    var cs = exports.state;
    // arrow keys L/R/F/B
    if (k === 37)
        cs.left = s;
    else if (k === 39)
        cs.right = s;
    else if (k === 38)
        cs.forward = s;
    else if (k === 40)
        cs.back = s;
    else if (k === 87) // W
        cs.up = s;
    else if (k === 83) // S
        cs.down = s;
    else if (k === 81) // Q
        cs.pitchup = s;
    else if (k === 65) // A
        cs.pitchdown = s;
}
function onKeyDown(ev) {
    if (!keyStates[ev.keyCode]) {
        setState(ev.keyCode, 1.0);
        keyStates[ev.keyCode] = true;
        var codeStr = ev.keyCode.toString();
        if (typeof keyPressListeners[codeStr] === 'function') {
            keyPressListeners[codeStr]();
        }
    }
}
function onKeyUp(ev) {
    if (keyStates[ev.keyCode]) {
        keyStates[ev.keyCode] = false;
        setState(ev.keyCode, 0.0);
    }
}
var initialized = false;
function init() {
    if (initialized)
        return;
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);
    initialized = true;
}
exports.init = init;
function getKeyState(code) {
    return keyStates[code];
}
exports.getKeyState = getKeyState;
function setKeyPressListener(code, fn) {
    keyPressListeners[code.toString()] = fn;
}
exports.setKeyPressListener = setKeyPressListener;

},{}],10:[function(require,module,exports){
"use strict";
// Loader that provides a dictionary of named assets
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="types/three-global.d.ts" />
/**
 * Create a Loader instance
 */
function Loader() {
    var isLoading = false;
    var totalToLoad = 0;
    var numLoaded = 0;
    var numFailed = 0;
    var success_cb;
    var progress_cb;
    var error_cb;
    var done_cb;
    var assets = { images: {}, text: {}, textures: {} };
    /**
     * Start loading a list of assets
     */
    function load(assetList, success, progress, error, done) {
        success_cb = success;
        progress_cb = progress;
        error_cb = error;
        done_cb = done;
        totalToLoad = 0;
        numLoaded = 0;
        numFailed = 0;
        isLoading = true;
        if (assetList.text) {
            totalToLoad += assetList.text.length;
            for (var i = 0; i < assetList.text.length; ++i) {
                loadText(assetList.text[i]);
            }
        }
        if (assetList.images) {
            totalToLoad += assetList.images.length;
            for (var i = 0; i < assetList.images.length; ++i) {
                loadImage(assetList.images[i]);
            }
        }
        if (assetList.textures) {
            totalToLoad += assetList.textures.length;
            for (var i = 0; i < assetList.textures.length; ++i) {
                loadTexture(assetList.textures[i]);
            }
        }
    }
    function loadText(ad) {
        console.log('loading ' + ad.url);
        var req = new XMLHttpRequest();
        req.overrideMimeType('*/*');
        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    assets.text[ad.name] = req.responseText;
                    console.log('loaded ' + ad.name);
                    doProgress();
                }
                else {
                    doError("Error " + req.status + " loading " + ad.url);
                }
            }
        };
        req.open('GET', ad.url);
        req.send();
    }
    function loadImage(ad) {
        var img = new Image();
        assets.images[ad.name] = img;
        img.onload = doProgress;
        img.onerror = doError;
        img.src = ad.url;
    }
    function loadTexture(ad) {
        assets.textures[ad.name] = new THREE.TextureLoader().load(ad.url, doProgress);
    }
    function doProgress() {
        numLoaded += 1;
        progress_cb && progress_cb(numLoaded / totalToLoad);
        tryDone();
    }
    function doError(e) {
        error_cb && error_cb(e);
        numFailed += 1;
        tryDone();
    }
    function tryDone() {
        if (!isLoading)
            return true;
        if (numLoaded + numFailed >= totalToLoad) {
            var ok = !numFailed;
            if (ok && success_cb)
                success_cb(assets);
            done_cb && done_cb(ok);
            isLoading = false;
        }
        return !isLoading;
    }
    /**
     *  Public interface
     */
    return {
        load: load,
        getAssets: function () { return assets; }
    };
} // end Loader
exports.default = Loader;

},{}],11:[function(require,module,exports){
"use strict";
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var visible = false;
function setText(txt) {
    util_1.$e('logger').textContent = txt;
}
exports.setText = setText;
function setHtml(html) {
    util_1.$e('logger').innerHTML = html;
}
exports.setHtml = setHtml;
function toggle() {
    var el = util_1.$e('logger');
    visible = !visible;
    if (visible) {
        el.style.display = 'inline-block';
    }
    else {
        el.style.display = 'none';
    }
}
exports.toggle = toggle;
function hide() {
    util_1.$e('logger').style.display = 'none';
    visible = false;
}
exports.hide = hide;
function show() {
    util_1.$e('logger').style.display = 'inline-block';
    visible = true;
}
exports.show = show;
function isVisible() {
    return visible;
}
exports.isVisible = isVisible;

},{"./util":19}],12:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = __importDefault(require("./app"));
app_1.default().run();

},{"./app":2}],13:[function(require,module,exports){
"use strict";
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var anim = __importStar(require("./anim"));
var notifying = false;
function notify(msg) {
    var elTxt = util_1.$e('notification_text');
    elTxt.textContent = msg;
    if (notifying)
        return;
    var el = util_1.$e('notification');
    el.style.display = 'block';
    el.style.opacity = '1.0';
    notifying = true;
    setTimeout(function () {
        anim.fadeOut(el, 1000, function () {
            el.style.display = 'none';
            elTxt.textContent = '';
            notifying = false;
        });
    }, 4000);
}
exports.default = notify;

},{"./anim":1,"./util":19}],14:[function(require,module,exports){
"use strict";
// Copyright (c) 2016 by Mike Linkovich
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var gmath_1 = require("./gmath");
var vec_1 = require("./vec");
var input = __importStar(require("./input"));
var notification_1 = __importDefault(require("./notification"));
var heightfield_1 = __importDefault(require("./heightfield"));
var log = __importStar(require("./logger"));
var DEFAULT_HEIGHT = 0.0;
var MIN_HEIGHT = 2.5;
var MAX_HEIGHT = 275.0;
var FLOAT_VEL = 0.75;
var BOB_RANGE = 16.0;
var DEFAULT_PITCH = -0.325;
var MOVE_RANGE = 1500.0;
var ACCEL = 90.0; // forward accel
var DRAG = 0.1;
var VACCEL = 60.0; // vertical accel
var VDRAG = 5.0;
var YAW_ACCEL = 4.0; // angular accel (yaw)
var YAW_DRAG = 2.0;
var PITCH_ACCEL = 4.0;
var PITCH_RESIST = 16.0;
var PITCH_FRIC = 8.0;
var ROLL_ACCEL = 2.0;
var ROLL_RESIST = 10.0;
var ROLL_FRIC = 8.0;
var MAN_VEL = 40.0;
var MAN_ZVEL = 10.0;
var MAN_YAWVEL = 0.5;
var MAN_PITCHVEL = 0.5;
var MAN_MAXPITCH = Math.PI / 4.0;
var MODE_AUTO = 0;
var MODE_FLY = 1;
var MODE_MAN = 2;
var NUM_MODES = 3;
/** Creates a Player instance (User first person camera) */
function Player(heightField, waterHeight) {
    //let autoplay = true
    var mode = MODE_AUTO;
    var curT = 0;
    var state = {
        pos: vec_1.Vec3.create(0.0, 0.0, DEFAULT_HEIGHT),
        vel: vec_1.Vec3.create(0.0, 0.0, 0.0),
        dir: vec_1.Vec3.create(1.0, 0.0, 0.0),
        yaw: 0.0,
        yawVel: 0.0,
        pitch: 0.0,
        pitchVel: 0.0,
        roll: 0.0,
        rollVel: 0.0,
        floatHeight: 0.0
    };
    input.setKeyPressListener(13, function () {
        nextMode();
        if (mode === MODE_AUTO) {
            log.hide();
            notification_1.default('Press ENTER to change camera');
        }
        else if (mode === MODE_FLY) {
            notification_1.default('ARROWS drive, W/S move up/down.');
        }
        else if (mode === MODE_MAN) {
            log.show();
            notification_1.default('ARROWS move, W/S move up/down, Q/A look up/down');
        }
    });
    // scratchpad vectors
    var _a = vec_1.Vec3.create();
    var _d = vec_1.Vec3.create();
    var _p1 = vec_1.Vec3.create();
    var _p2 = vec_1.Vec3.create();
    var _p3 = vec_1.Vec3.create();
    /**
     * @param dt Delta time in ms
     */
    function update(dt) {
        curT += dt;
        // Update auto or manual
        if (mode === MODE_AUTO) {
            updateAuto(curT / 1000.0, dt);
        }
        else if (mode === MODE_FLY) {
            updateDrone(input.state, dt);
        }
        else if (mode === MODE_MAN) {
            updateManual(input.state, dt);
        }
        // Calc cam look direction vector
        var d = state.dir;
        d.z = Math.sin(state.pitch);
        var s = (1.0 - Math.abs(d.z));
        d.x = Math.cos(state.yaw) * s;
        d.y = Math.sin(state.yaw) * s;
    }
    function nextMode() {
        mode = (mode + 1) % NUM_MODES;
        if (mode === MODE_MAN) {
            state.roll = 0;
            state.rollVel = 0;
            state.pitchVel = 0;
            state.yawVel = 0;
        }
    }
    function getMode() {
        return mode;
    }
    /**
     * Update autoplay camera
     * @param time Time in seconds
     */
    function updateAuto(time, dt) {
        var ft = dt / 1000.0;
        // Remember last frame values
        vec_1.Vec3.copy(state.pos, _a);
        var yaw0 = state.yaw;
        var pitch0 = state.pitch;
        // Follow a nice curvy path...
        //state.pos.x = Math.cos(r) * MOVE_RANGE + Math.sin(r) * MOVE_RANGE * 2.0
        //state.pos.y = Math.sin(r) * MOVE_RANGE + Math.cos(r) * MOVE_RANGE * 2.0
        autoPos(time * 0.01, state.pos);
        // Look ahead a few steps so we can see if there are
        // sudden height increases to look for
        autoPos((time + 1.0) * 0.01, _p1);
        autoPos((time + 2.0) * 0.01, _p2);
        autoPos((time + 3.0) * 0.01, _p3);
        // Move up & down smoothly
        var a = time * 0.3;
        state.pos.z = BOB_RANGE + Math.cos(a) * BOB_RANGE;
        // Look up & down depending on height
        state.pitch = DEFAULT_PITCH - 0.25 * Math.sin(a + Math.PI * 0.5);
        // Turn left & right smoothly over time
        state.yaw = Math.sin(time * 0.04) * Math.PI * 2.0 + Math.PI * 0.5;
        // Actual height at camera
        var groundHeight = Math.max(heightfield_1.default.heightAt(heightField, state.pos.x, state.pos.y, true), waterHeight);
        // Look ahead heights
        var h1 = Math.max(heightfield_1.default.heightAt(heightField, _p1.x, _p1.y, true), waterHeight);
        var h2 = Math.max(heightfield_1.default.heightAt(heightField, _p2.x, _p2.y, true), waterHeight);
        var h3 = Math.max(heightfield_1.default.heightAt(heightField, _p3.x, _p3.y, true), waterHeight);
        //let minHeight = (groundHeight + h1 + h2 + h3) / 4.0
        var minHeight = Math.max(Math.max(Math.max(groundHeight, h1), h2), h3);
        var floatVel = (state.floatHeight < minHeight) ?
            (minHeight - state.floatHeight) : (groundHeight - state.floatHeight);
        if (floatVel < 0) {
            floatVel *= 0.25; // can sink more slowly
        }
        state.floatHeight += floatVel * FLOAT_VEL * ft;
        // Make absolutely sure we're above ground
        if (state.floatHeight < groundHeight)
            state.floatHeight = groundHeight;
        state.pos.z += state.floatHeight + MIN_HEIGHT;
        // Calc velocities based on difs from prev frame
        _d.x = state.pos.x - _a.x;
        _d.y = state.pos.y - _a.y;
        _d.z = state.pos.z - _a.z;
        state.vel.x = _d.x / ft;
        state.vel.y = _d.y / ft;
        state.vel.z = _d.z / ft;
        var dyaw = state.yaw - yaw0;
        state.yawVel = dyaw / ft;
        var dpitch = state.pitch - pitch0;
        state.pitchVel = dpitch / ft;
    }
    function autoPos(r, p) {
        p.x = Math.cos(r) * MOVE_RANGE + Math.sin(r) * MOVE_RANGE * 2.0;
        p.y = Math.sin(r) * MOVE_RANGE + Math.cos(r) * MOVE_RANGE * 2.0;
    }
    /**
     * Drone-like physics
     */
    function updateDrone(i, dt) {
        // Delta time in seconds
        var ft = dt / 1000.0;
        // calc roll accel
        var ra = 0;
        if (i.left > 0) {
            ra = -ROLL_ACCEL;
        }
        else if (i.right > 0) {
            ra = ROLL_ACCEL;
        }
        // calc roll resist forces
        var rr = -state.roll * ROLL_RESIST;
        var rf = -gmath_1.sign(state.rollVel) * ROLL_FRIC * Math.abs(state.rollVel);
        // total roll accel
        ra = ra + rr + rf;
        state.rollVel += ra * ft;
        state.roll += state.rollVel * ft;
        // Calc yaw accel
        var ya = -state.roll * YAW_ACCEL;
        // yaw drag
        var yd = -gmath_1.sign(state.yawVel) * Math.abs(Math.pow(state.yawVel, 3.0)) * YAW_DRAG;
        // update yaw
        state.yawVel += (ya + yd) * ft;
        state.yaw += state.yawVel * ft;
        // Calc pitch accel
        var pa = 0;
        if (i.forward > 0) {
            pa = -PITCH_ACCEL;
        }
        else if (i.back > 0) {
            pa = PITCH_ACCEL * 0.5;
        }
        // Calc pitch resist forces
        var pr = -state.pitch * PITCH_RESIST;
        var pf = -gmath_1.sign(state.pitchVel) * PITCH_FRIC * Math.abs(state.pitchVel);
        // total pitch accel
        pa = pa + pr + pf;
        state.pitchVel += pa * ft;
        state.pitch += state.pitchVel * ft;
        // Calc accel vector
        vec_1.Vec3.set(_a, 0, 0, 0);
        _a.x = -state.pitch * ACCEL * Math.cos(state.yaw);
        _a.y = -state.pitch * ACCEL * Math.sin(state.yaw);
        // Calc drag vector (horizontal)
        var absVel = vec_1.Vec2.length(state.vel); // state.vel.length()
        _d.x = -state.vel.x;
        _d.y = -state.vel.y;
        vec_1.Vec2.setLength(_d, absVel * DRAG, _d);
        // Calc vertical accel
        if (i.up > 0 && state.pos.z < MAX_HEIGHT - 2.0) {
            _a.z = VACCEL;
        }
        else if (i.down > 0 && state.pos.z > MIN_HEIGHT) {
            _a.z = -VACCEL;
        }
        _d.z = -state.vel.z * VDRAG;
        // update vel
        state.vel.x += (_a.x + _d.x) * ft;
        state.vel.y += (_a.y + _d.y) * ft;
        state.vel.z += (_a.z + _d.z) * ft;
        // update pos
        state.pos.x += state.vel.x * ft;
        state.pos.y += state.vel.y * ft;
        state.pos.z += state.vel.z * ft;
        var groundHeight = Math.max(heightfield_1.default.heightAt(heightField, state.pos.x, state.pos.y, true), waterHeight);
        if (state.pos.z < groundHeight + MIN_HEIGHT) {
            state.pos.z = groundHeight + MIN_HEIGHT;
        }
        else if (state.pos.z > MAX_HEIGHT) {
            state.pos.z = MAX_HEIGHT;
        }
    }
    /**
     * Manual movement
     */
    function updateManual(i, dt) {
        var ft = dt / 1000.0;
        state.yawVel = 0;
        if (i.left) {
            state.yawVel = MAN_YAWVEL;
        }
        else if (i.right) {
            state.yawVel = -MAN_YAWVEL;
        }
        state.yaw += state.yawVel * ft;
        state.pitchVel = 0;
        if (i.pitchup) {
            state.pitchVel = MAN_PITCHVEL;
        }
        else if (i.pitchdown) {
            state.pitchVel = -MAN_PITCHVEL;
        }
        state.pitch += state.pitchVel * ft;
        state.pitch = gmath_1.clamp(state.pitch, -MAN_MAXPITCH, MAN_MAXPITCH);
        vec_1.Vec3.set(state.vel, 0, 0, 0);
        if (i.forward) {
            state.vel.x = MAN_VEL * Math.cos(state.yaw);
            state.vel.y = MAN_VEL * Math.sin(state.yaw);
        }
        else if (i.back) {
            state.vel.x = -MAN_VEL * Math.cos(state.yaw);
            state.vel.y = -MAN_VEL * Math.sin(state.yaw);
        }
        state.pos.x += state.vel.x * ft;
        state.pos.y += state.vel.y * ft;
        if (i.up) {
            state.vel.z = MAN_ZVEL;
        }
        else if (i.down) {
            state.vel.z = -MAN_ZVEL;
        }
        state.pos.z += state.vel.z * ft;
        var groundHeight = Math.max(heightfield_1.default.heightAt(heightField, state.pos.x, state.pos.y, true), waterHeight);
        if (state.pos.z < groundHeight + MIN_HEIGHT) {
            state.pos.z = groundHeight + MIN_HEIGHT;
        }
        else if (state.pos.z > MAX_HEIGHT) {
            state.pos.z = MAX_HEIGHT;
        }
    }
    /**
     * Public interface
     */
    return {
        update: update,
        state: state,
        getMode: getMode,
        nextMode: nextMode
    };
}
exports.default = Player;

},{"./gmath":6,"./heightfield":8,"./input":9,"./logger":11,"./notification":13,"./vec":20}],15:[function(require,module,exports){
"use strict";
/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 * --------------------
 * TypeScriptified 2016
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Grad = /** @class */ (function () {
    function Grad(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Grad.prototype.dot2 = function (x, y) {
        return this.x * x + this.y * y;
    };
    Grad.prototype.dot3 = function (x, y, z) {
        return this.x * x + this.y * y + this.z * z;
    };
    return Grad;
}());
var F2 = 0.5 * (Math.sqrt(3) - 1);
var G2 = (3 - Math.sqrt(3)) / 6;
var perm = new Array(512);
var gradP = new Array(512);
var grad3 = [
    new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
    new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
    new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)
];
var p = [
    151, 160, 137, 91, 90, 15,
    131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
    190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
    77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
    102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
    135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
    5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
    223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
    251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
    49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
    138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
];
// This isn't a very good seeding function, but it works ok. It supports 2^16
// different seed values. Write something better if you need more seeds.
function seed(seed) {
    if (seed > 0 && seed < 1) {
        // Scale the seed out
        seed *= 65536;
    }
    seed = Math.floor(seed);
    if (seed < 256) {
        seed |= seed << 8;
    }
    for (var i = 0; i < 256; i++) {
        var v = void 0;
        if (i & 1) {
            v = p[i] ^ (seed & 255);
        }
        else {
            v = p[i] ^ ((seed >> 8) & 255);
        }
        perm[i] = perm[i + 256] = v;
        gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
}
seed(0);
// 2D simplex noise
function simplex(xin, yin) {
    var n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    var s = (xin + yin) * F2; // Hairy factor for 2D
    var i = Math.floor(xin + s);
    var j = Math.floor(yin + s);
    var t = (i + j) * G2;
    var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin - j + t;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        i1 = 1;
        j1 = 0;
    }
    else { // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        i1 = 0;
        j1 = 1;
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
    var y2 = y0 - 1 + 2 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;
    var gi0 = gradP[i + perm[j]];
    var gi1 = gradP[i + i1 + perm[j + j1]];
    var gi2 = gradP[i + 1 + perm[j + 1]];
    // Calculate the contribution from the three corners
    var t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
        n0 = 0;
    }
    else {
        t0 *= t0;
        n0 = t0 * t0 * gi0.dot2(x0, y0); // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
        n1 = 0;
    }
    else {
        t1 *= t1;
        n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    var t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
        n2 = 0;
    }
    else {
        t2 *= t2;
        n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
}
exports.default = simplex;

},{}],16:[function(require,module,exports){
"use strict";
/// <reference path="types/three-global.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
function createMesh(tex, radius, lats, lngs) {
    if (lats === void 0) { lats = 16; }
    if (lngs === void 0) { lngs = 32; }
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return new THREE.Mesh(new THREE.SphereGeometry(radius, lngs, lats, 0, Math.PI * 2.0, 0, Math.PI / 2.0).rotateX(Math.PI / 2.0).rotateZ(Math.PI), new THREE.MeshBasicMaterial({
        color: 0xFFFFFF, side: THREE.BackSide, map: tex, fog: false
    }));
}
exports.createMesh = createMesh;

},{}],17:[function(require,module,exports){
"use strict";
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="types/three-global.d.ts" />
var vec_1 = require("./vec");
// Terrain uses a custom shader so that we can apply the same
// type of fog as is applied to the grass. This way they both
// blend to green first, then blend to atmosphere color in the
// distance.
// Uses terrain shaders (see: shader/terrain.*.glsl)
var MAX_INDICES = 262144; // 65536
var TEX_SCALE = 1.0 / 6.0; // texture scale per quad
function Terrain(opts) {
    // max square x,y divisions that will fit in max indices
    var xCellCount = Math.floor(Math.sqrt(MAX_INDICES / (3 * 2)));
    var yCellCount = xCellCount;
    var cellSize = 1.0 / opts.heightMapScale.x / xCellCount;
    return {
        cellSize: cellSize,
        xCellCount: xCellCount,
        yCellCount: yCellCount,
        xSize: xCellCount * cellSize,
        ySize: yCellCount * cellSize,
        mesh: createMesh(opts)
    };
}
(function (Terrain) {
    function update(t, x, y) {
        var ix = Math.floor(x / t.cellSize);
        var iy = Math.floor(y / t.cellSize);
        var ox = ix * t.cellSize;
        var oy = iy * t.cellSize;
        var mat = t.mesh.material;
        var p = mat.uniforms['offset'].value;
        p[0] = ox;
        p[1] = oy;
        p = mat.uniforms['uvOffset'].value;
        p[0] = iy * TEX_SCALE; // not sure why x,y need to be swapped here...
        p[1] = ix * TEX_SCALE;
    }
    Terrain.update = update;
})(Terrain || (Terrain = {}));
exports.default = Terrain;
// Internal helpers...
/** Creates a textured plane larger than the viewer will ever travel */
function createMesh(opts) {
    // max x,y divisions that will fit 65536 indices
    var xCellCount = Math.floor(Math.sqrt(MAX_INDICES / (3 * 2)));
    var yCellCount = xCellCount;
    var cellSize = 1.0 / opts.heightMapScale.x / xCellCount;
    var texs = opts.textures;
    texs.forEach(function (tex) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = 9;
    });
    var htex = opts.heightMap;
    htex.wrapS = htex.wrapT = THREE.RepeatWrapping;
    var vtxBufs = createVtxBuffers(cellSize, xCellCount + 1, yCellCount + 1);
    var idBuf = createIdBuffer(xCellCount + 1, yCellCount + 1);
    var geo = new THREE.BufferGeometry();
    geo.addAttribute('position', new THREE.BufferAttribute(vtxBufs.position, 3));
    geo.addAttribute('uv', new THREE.BufferAttribute(vtxBufs.uv, 2));
    geo.setIndex(new THREE.BufferAttribute(idBuf, 1));
    var hscale = opts.heightMapScale;
    var fragScript = opts.fragScript.replace('%%TRANSITION_LOW%%', opts.transitionLow.toString()).replace('%%TRANSITION_HIGH%%', opts.transitionHigh.toString());
    var mat = new THREE.RawShaderMaterial({
        uniforms: {
            offset: { type: '2f', value: [0.0, 0.0] },
            uvOffset: { type: '2f', value: [0.0, 0.0] },
            map1: { type: 't', value: texs[0] },
            map2: { type: 't', value: texs[1] },
            heightMap: { type: 't', value: htex },
            heightMapScale: { type: '3f', value: [hscale.x, hscale.y, hscale.z] },
            fogColor: { type: '3f', value: vec_1.Color.toArray(opts.fogColor) },
            fogNear: { type: 'f', value: 1.0 },
            fogFar: { type: 'f', value: opts.fogFar },
            grassFogFar: { type: 'f', value: opts.grassFogFar }
        },
        vertexShader: opts.vertScript,
        fragmentShader: fragScript
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    return mesh;
}
/**
 * @param cellSize Size of each mesh cell (quad)
 * @param xcount X vertex count
 * @param ycount Y vertex count
 */
function createVtxBuffers(cellSize, xcount, ycount) {
    var pos = new Float32Array(xcount * ycount * 3);
    var uv = new Float32Array(xcount * ycount * 2);
    var ix, iy;
    var x, y;
    var u, v;
    var i = 0;
    var j = 0;
    for (iy = 0; iy < ycount; ++iy) {
        y = (iy - ycount / 2.0) * cellSize;
        u = iy;
        for (ix = 0; ix < xcount; ++ix) {
            x = (ix - xcount / 2.0) * cellSize;
            v = ix;
            pos[i++] = x;
            pos[i++] = y;
            pos[i++] = 4.0 * Math.cos(ix * 1.0) + 4.0 * Math.sin(iy * 1.0);
            uv[j++] = u * TEX_SCALE;
            uv[j++] = v * TEX_SCALE;
        }
    }
    return { position: pos, uv: uv };
}
/**
 * @param xcount X vertex count
 * @param ycount Y vertex count
 */
function createIdBuffer(xcount, ycount) {
    var idSize = (xcount - 1) * (ycount - 1) * 3 * 2;
    var id;
    if (idSize <= 65536) {
        id = new Uint16Array(idSize);
    }
    else {
        id = new Uint32Array(idSize);
    }
    var xc = xcount - 1;
    var yc = ycount - 1;
    var x, y;
    for (y = 0; y < yc; ++y) {
        for (x = 0; x < xc; ++x) {
            var i = 6 * (y * xc + x);
            // tri 1
            id[i + 0] = (y + 0) * xcount + (x + 0);
            id[i + 1] = (y + 0) * xcount + (x + 1);
            id[i + 2] = (y + 1) * xcount + (x + 1);
            // tri 2
            id[i + 3] = (y + 1) * xcount + (x + 1);
            id[i + 4] = (y + 1) * xcount + (x + 0);
            id[i + 5] = (y + 0) * xcount + (x + 0);
        }
    }
    return id;
}

},{"./vec":20}],18:[function(require,module,exports){
"use strict";
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="types/three-global.d.ts" />
var gmath_1 = require("./gmath");
var vec_1 = require("./vec");
/**
 * Create a texture containing height, lighting, etc. data
 * encoded into RGBA channels.
 */
function createTexture(hf, lightDir, imgWind) {
    var canvas = document.createElement('canvas');
    var canvasWidth = hf.xCount + 1;
    var canvasHeight = hf.yCount + 1;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    var ctx = canvas.getContext('2d');
    var imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    // Fill R (height) and G (light) values from heightfield data and computed light
    computeData(hf, lightDir, imgData.data);
    // Add wind intensity to B channel
    addWindData(imgWind, imgData.data);
    ctx.putImageData(imgData, 0, 0);
    var tex = new THREE.Texture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
}
exports.createTexture = createTexture;
/**
 * Pack heights and lighting into RGBA data
 */
function computeData(hf, lightDir, buf) {
    var vnorms = hf.vtxNormals;
    var w = hf.xCount + 1;
    var h = hf.yCount + 1;
    var n = vec_1.Vec3.create();
    var tStart = Date.now();
    for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x) {
            var iSrc = y * w + x;
            var iDst = (h - y - 1) * w + x;
            // Get height, scale & store in R component
            buf[iDst * 4 + 0] = Math.round(hf.heights[iSrc] / hf.maxHeight * 255.0);
            // Get normal at this location to compute light
            var ni = iSrc * 3;
            n.x = vnorms[ni++];
            n.y = vnorms[ni++];
            n.z = vnorms[ni++];
            // Compute light & store in G component
            var light = Math.max(-vec_1.Vec3.dot(n, lightDir), 0.0);
            light *= computeShade(hf, lightDir, x, y);
            buf[iDst * 4 + 1] = Math.round(light * 255.0);
            //buf[iDst * 4 + 2] = ... // B channel for terrain type?
            buf[iDst * 4 + 3] = 255; // must set alpha to some value > 0
        }
    }
    var dt = Date.now() - tStart;
    console.log("computed terrain data texture (" + w + "x" + h + ") values in " + dt + "ms");
    return buf;
}
var _v = vec_1.Vec2.create();
function computeShade(hf, lightDir, ix, iy) {
    // Make a normalized 2D direction vector we'll use to walk horizontally
    // toward the lightsource until z reaches max height
    var shadGradRange = 5.0;
    var hdir = _v;
    var w = hf.xCount + 1;
    var h = hf.yCount + 1;
    var i = iy * w + ix;
    var height = hf.heights[i]; // height at this point
    hdir.x = -lightDir.x;
    hdir.y = -lightDir.y;
    vec_1.Vec2.normalize(hdir, hdir);
    var zstep = (vec_1.Vec2.length(hdir) / vec_1.Vec2.length(lightDir)) * (-lightDir.z);
    var x = ix;
    var y = iy;
    // Walk along the direction until we discover this point
    // is in shade or the light vector is too high to be shaded
    while (height < hf.maxHeight) {
        x += hdir.x;
        y += hdir.y;
        height += zstep;
        var qx = gmath_1.pmod(Math.round(x), w);
        var qy = gmath_1.pmod(Math.round(y), h);
        var sampleHeight = hf.heights[qy * w + qx];
        if (sampleHeight > height) {
            if (sampleHeight - height > shadGradRange)
                return 0.7; // this point is in shade
            else
                return 0.7 + 0.3 * (shadGradRange - (sampleHeight - height)) / shadGradRange;
        }
    }
    return 1.0;
}
/**
 * Put wind data from the wind image to the b channel
 */
function addWindData(imgWind, buf) {
    var canvas = document.createElement('canvas');
    var w = imgWind.naturalWidth;
    var h = imgWind.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    var ctxSrc = canvas.getContext('2d');
    ctxSrc.drawImage(imgWind, 0, 0);
    var windData = ctxSrc.getImageData(0, 0, w, h).data;
    for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x) {
            var i = (y * w + x) * 4;
            // Get R channel from src. We only use the single channel
            // because assume src img is grayscale.
            var p = windData[i];
            // Now set the B channel of the buffer we're writing to
            buf[i + 2] = p;
        }
    }
}

},{"./gmath":6,"./vec":20}],19:[function(require,module,exports){
"use strict";
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
function $e(id) {
    return document.getElementById(id);
}
exports.$e = $e;
function $i(id) {
    return document.getElementById(id);
}
exports.$i = $i;
function detectWebGL() {
    try {
        var canvas = document.createElement('canvas');
        return (!!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl'));
    }
    catch (e) {
        return null;
    }
}
exports.detectWebGL = detectWebGL;

},{}],20:[function(require,module,exports){
"use strict";
// Vector Math with library-agnostic interface types.
// i.e. Any object with matching property names will work,
// whether three.js, cannon.js, etc.
//
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 3D Vector functions
 */
var Vec2;
(function (Vec2) {
    function create(x, y) {
        return {
            x: (typeof x === 'number') ? x : 0.0,
            y: (typeof y === 'number') ? y : 0.0
        };
    }
    Vec2.create = create;
    function clone(v) {
        return create(v.x, v.y);
    }
    Vec2.clone = clone;
    function set(v, x, y) {
        v.x = x;
        v.y = y;
    }
    Vec2.set = set;
    function copy(src, out) {
        out.x = src.x;
        out.y = src.y;
    }
    Vec2.copy = copy;
    function length(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }
    Vec2.length = length;
    function setLength(v, l, out) {
        var s = length(v);
        if (s > 0.0) {
            s = l / s;
            out.x = v.x * s;
            out.y = v.y * s;
        }
        else {
            out.x = l;
            out.y = 0.0;
        }
    }
    Vec2.setLength = setLength;
    function dist(v0, v1) {
        var dx = v1.x - v0.x;
        var dy = v1.y - v0.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    Vec2.dist = dist;
    function normalize(v, out) {
        setLength(v, 1.0, out);
    }
    Vec2.normalize = normalize;
    function dot(v0, v1) {
        return (v0.x * v1.x + v0.y * v1.y);
    }
    Vec2.dot = dot;
    function det(v0, v1) {
        return (v0.x * v1.y - v0.y * v1.x);
    }
    Vec2.det = det;
    /** Rotate v by r radians, result in out. (v and out can reference the same Vec2 object) */
    function rotate(v, r, out) {
        var c = Math.cos(r), s = Math.sin(r), x = v.x, y = v.y;
        out.x = x * c - y * s;
        out.y = x * s + y * c;
    }
    Vec2.rotate = rotate;
    /** Uses pre-computed cos & sin values of rotation angle */
    function rotateCS(v, c, s, out) {
        var x = v.x, y = v.y;
        out.x = x * c - y * s;
        out.y = x * s + y * c;
    }
    Vec2.rotateCS = rotateCS;
    /** nx,ny should be normalized; vx,vy length will be preserved */
    function reflect(v, n, out) {
        var d = dot(n, v);
        out.x = v.x - 2.0 * d * n.x;
        out.y = v.y - 2.0 * d * n.y;
    }
    Vec2.reflect = reflect;
    function toArray(v) {
        return [v.x, v.y];
    }
    Vec2.toArray = toArray;
})(Vec2 = exports.Vec2 || (exports.Vec2 = {}));
/**
 * 3D Vector functions
 */
var Vec3;
(function (Vec3) {
    function create(x, y, z) {
        return {
            x: (typeof x === 'number') ? x : 0.0,
            y: (typeof y === 'number') ? y : 0.0,
            z: (typeof z === 'number') ? z : 0.0
        };
    }
    Vec3.create = create;
    function clone(v) {
        return create(v.x, v.y, v.z);
    }
    Vec3.clone = clone;
    function set(v, x, y, z) {
        v.x = x;
        v.y = y;
        v.z = z;
    }
    Vec3.set = set;
    function copy(src, out) {
        out.x = src.x;
        out.y = src.y;
        out.z = src.z;
    }
    Vec3.copy = copy;
    function length(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }
    Vec3.length = length;
    function setLength(v, l, out) {
        var s = length(v);
        if (s > 0.0) {
            s = l / s;
            out.x = v.x * s;
            out.y = v.y * s;
            out.z = v.z * s;
        }
        else {
            out.x = l;
            out.y = 0.0;
            out.z = 0.0;
        }
    }
    Vec3.setLength = setLength;
    function dist(v0, v1) {
        var dx = v1.x - v0.x;
        var dy = v1.y - v0.y;
        var dz = v1.z - v0.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    Vec3.dist = dist;
    function normalize(v, out) {
        Vec3.setLength(v, 1.0, out);
    }
    Vec3.normalize = normalize;
    function dot(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    Vec3.dot = dot;
    function cross(a, b, out) {
        var ax = a.x, ay = a.y, az = a.z, bx = b.x, by = b.y, bz = b.z;
        out.x = ay * bz - az * by;
        out.y = az * bx - ax * bz;
        out.z = ax * by - ay * bx;
    }
    Vec3.cross = cross;
    function toArray(v) {
        return [v.x, v.y, v.z];
    }
    Vec3.toArray = toArray;
})(Vec3 = exports.Vec3 || (exports.Vec3 = {}));
/**
 * RGB Color functions
 */
var Color;
(function (Color) {
    function create(r, g, b) {
        return {
            r: (typeof r === 'number') ? r : 0.0,
            g: (typeof g === 'number') ? g : 0.0,
            b: (typeof b === 'number') ? b : 0.0
        };
    }
    Color.create = create;
    function toArray(c) {
        return [c.r, c.g, c.b];
    }
    Color.toArray = toArray;
    function to24bit(c) {
        return (c.r * 255) << 16 ^ (c.g * 255) << 8 ^ (c.b * 255) << 0;
    }
    Color.to24bit = to24bit;
})(Color = exports.Color || (exports.Color = {}));

},{}],21:[function(require,module,exports){
"use strict";
//
// Water mesh
// A flat plane extending to frustum depth that follows
// viewer position horizontally.
// Shader does environmental mapping to reflect skydome,
// blend with water colour, and apply fog in distance.
//
Object.defineProperty(exports, "__esModule", { value: true });
// Uses water shaders (see: shader/water.*.glsl)
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
/// <reference path="types/three-global.d.ts" />
var vec_1 = require("./vec");
var _time = 0;
/** Create Water Mesh */
function createMesh(opts) {
    opts.envMap.wrapS = opts.envMap.wrapT = THREE.RepeatWrapping;
    opts.envMap.minFilter = opts.envMap.magFilter = THREE.LinearFilter;
    opts.envMap.generateMipmaps = false;
    var mat = new THREE.RawShaderMaterial({
        uniforms: {
            time: { type: '1f', value: 0.0 },
            viewPos: { type: '3f', value: [0.0, 0.0, 10.0] },
            map: { type: 't', value: opts.envMap },
            waterLevel: { type: '1f', value: opts.waterLevel },
            waterColor: { type: '3f', value: vec_1.Color.toArray(opts.waterColor) },
            fogColor: { type: '3f', value: vec_1.Color.toArray(opts.fogColor) },
            fogNear: { type: 'f', value: 1.0 },
            fogFar: { type: 'f', value: opts.fogFar * 1.5 },
        },
        vertexShader: opts.vertScript,
        fragmentShader: opts.fragScript
    });
    var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000.0, 2000.0), mat);
    mesh.frustumCulled = false;
    _time = Date.now();
    return mesh;
}
exports.createMesh = createMesh;
function update(mesh, viewPos) {
    mesh.position.x = viewPos.x;
    mesh.position.y = viewPos.y;
    var mat = mesh.material;
    var vp = mat.uniforms['viewPos'].value;
    vp[0] = viewPos.x;
    vp[1] = viewPos.y;
    vp[2] = viewPos.z;
    mat.uniforms['time'].value = (Date.now() - _time) / 250.0;
}
exports.update = update;

},{"./vec":20}],22:[function(require,module,exports){
"use strict";
// Copyright (c) 2016 by Mike Linkovich
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="types/three-global.d.ts" />
var util_1 = require("./util");
var gmath_1 = require("./gmath");
var vec_1 = require("./vec");
var logger = __importStar(require("./logger"));
var input = __importStar(require("./input"));
var skydome = __importStar(require("./skydome"));
var heightfield_1 = __importStar(require("./heightfield"));
var grass = __importStar(require("./grass"));
var terrain_1 = __importDefault(require("./terrain"));
var terramap = __importStar(require("./terramap"));
var water = __importStar(require("./water"));
var player_1 = __importDefault(require("./player"));
var fps_1 = __importDefault(require("./fps"));
var VIEW_DEPTH = 2000.0;
var MAX_TIMESTEP = 67; // max 67 ms/frame
var HEIGHTFIELD_SIZE = 3072.0;
var HEIGHTFIELD_HEIGHT = 180.0;
var WATER_LEVEL = HEIGHTFIELD_HEIGHT * 0.305556; // 55.0
var BEACH_TRANSITION_LOW = 0.31;
var BEACH_TRANSITION_HIGH = 0.36;
var LIGHT_DIR = vec_1.Vec3.create(0.0, 1.0, -1.0);
vec_1.Vec3.normalize(LIGHT_DIR, LIGHT_DIR);
var FOG_COLOR = vec_1.Color.create(0.74, 0.77, 0.91);
var GRASS_COLOR = vec_1.Color.create(0.45, 0.46, 0.19);
var WATER_COLOR = vec_1.Color.create(0.6, 0.7, 0.85);
var WIND_DEFAULT = 1.5;
var WIND_MAX = 3.0;
var MAX_GLARE = 0.25; // max glare effect amount
var GLARE_RANGE = 1.1; // angular range of effect
var GLARE_YAW = Math.PI * 1.5; // yaw angle when looking directly at sun
var GLARE_PITCH = 0.2; // pitch angle looking at sun
var GLARE_COLOR = vec_1.Color.create(1.0, 0.8, 0.4);
var INTRO_FADE_DUR = 2000;
///////////////////////////////////////////////////////////////////////
/**
 * Create a World instance
 */
function World(assets, numGrassBlades, grassPatchRadius, displayWidth, displayHeight, antialias) {
    var canvas = util_1.$e('app_canvas');
    // Make canvas transparent so it isn't rendered as black for 1 frame at startup
    var renderer = new THREE.WebGLRenderer({
        canvas: canvas, antialias: antialias, clearColor: 0xFFFFFF, clearAlpha: 1, alpha: true
    });
    if (!renderer) {
        throw new Error("Failed to create THREE.WebGLRenderer");
    }
    // Setup some render values based on provided configs
    var fogDist = grassPatchRadius * 20.0;
    var grassFogDist = grassPatchRadius * 2.0;
    var camera = new THREE.PerspectiveCamera(45, displayWidth / displayHeight, 1.0, VIEW_DEPTH);
    var meshes = {
        terrain: null, grass: null, sky: null, water: null, sunFlare: null, fade: null
    };
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(vec_1.Color.to24bit(FOG_COLOR), 0.1, fogDist);
    // Setup the camera so Z is up.
    // Then we have cartesian X,Y coordinates along ground plane.
    camera.rotation.order = "ZXY";
    camera.rotation.x = Math.PI * 0.5;
    camera.rotation.y = Math.PI * 0.5;
    camera.rotation.z = Math.PI;
    camera.up.set(0.0, 0.0, 1.0);
    // Put camera in an object so we can transform it normally
    var camHolder = new THREE.Object3D();
    camHolder.rotation.order = "ZYX";
    camHolder.add(camera);
    scene.add(camHolder);
    // Setup heightfield
    var hfImg = assets.images['heightmap'];
    var hfCellSize = HEIGHTFIELD_SIZE / hfImg.width;
    var heightMapScale = vec_1.Vec3.create(1.0 / HEIGHTFIELD_SIZE, 1.0 / HEIGHTFIELD_SIZE, HEIGHTFIELD_HEIGHT);
    var heightField = heightfield_1.default({
        cellSize: hfCellSize,
        minHeight: 0.0,
        maxHeight: heightMapScale.z,
        image: hfImg
    });
    hfImg = undefined;
    var terraMap = terramap.createTexture(heightField, LIGHT_DIR, assets.images['noise']);
    var windIntensity = WIND_DEFAULT;
    // Create a large patch of grass to fill the foreground
    meshes.grass = grass.createMesh({
        lightDir: LIGHT_DIR,
        numBlades: numGrassBlades,
        radius: grassPatchRadius,
        texture: assets.textures['grass'],
        vertScript: assets.text['grass.vert'],
        fragScript: assets.text['grass.frag'],
        heightMap: terraMap,
        heightMapScale: heightMapScale,
        fogColor: FOG_COLOR,
        fogFar: fogDist,
        grassFogFar: grassFogDist,
        grassColor: GRASS_COLOR,
        transitionLow: BEACH_TRANSITION_LOW,
        transitionHigh: BEACH_TRANSITION_HIGH,
        windIntensity: windIntensity
    });
    // Set a specific render order - don't let three.js sort things for us.
    meshes.grass.renderOrder = 10;
    scene.add(meshes.grass);
    // Terrain mesh
    var terra = terrain_1.default({
        textures: [assets.textures['terrain1'], assets.textures['terrain2']],
        vertScript: assets.text['terrain.vert'],
        fragScript: assets.text['terrain.frag'],
        heightMap: terraMap,
        heightMapScale: heightMapScale,
        fogColor: FOG_COLOR,
        fogFar: fogDist,
        grassFogFar: grassFogDist,
        transitionLow: BEACH_TRANSITION_LOW,
        transitionHigh: BEACH_TRANSITION_HIGH
    });
    meshes.terrain = terra.mesh;
    meshes.terrain.renderOrder = 20;
    scene.add(meshes.terrain);
    // Skydome
    meshes.sky = skydome.createMesh(assets.textures['skydome'], VIEW_DEPTH * 0.95);
    meshes.sky.renderOrder = 30;
    scene.add(meshes.sky);
    meshes.sky.position.z = -25.0;
    meshes.water = water.createMesh({
        envMap: assets.textures['skyenv'],
        vertScript: assets.text['water.vert'],
        fragScript: assets.text['water.frag'],
        waterLevel: WATER_LEVEL,
        waterColor: WATER_COLOR,
        fogColor: FOG_COLOR,
        fogNear: 1.0,
        fogFar: fogDist
    });
    meshes.water.renderOrder = 40;
    scene.add(meshes.water);
    meshes.water.position.z = WATER_LEVEL;
    // White plane to cover screen for fullscreen fade-in from white
    meshes.fade = new THREE.Mesh(new THREE.PlaneBufferGeometry(6.0, 4.0, 1, 1), new THREE.MeshBasicMaterial({
        color: 0xFFFFFF, fog: false, transparent: true, opacity: 1.0,
        depthTest: false, depthWrite: false
    }));
    meshes.fade.position.x = 2.0; // place directly in front of camera
    meshes.fade.rotation.y = Math.PI * 1.5;
    meshes.fade.renderOrder = 10;
    camHolder.add(meshes.fade);
    camHolder.renderOrder = 100;
    // Bright yellow plane for sun glare using additive blending
    // to blow out the colours
    meshes.sunFlare = new THREE.Mesh(new THREE.PlaneBufferGeometry(6.0, 4.0, 1, 1), new THREE.MeshBasicMaterial({
        color: vec_1.Color.to24bit(GLARE_COLOR), fog: false, transparent: true, opacity: 0.0,
        depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    meshes.sunFlare.position.x = 2.05;
    meshes.sunFlare.rotation.y = Math.PI * 1.5;
    meshes.sunFlare.visible = false;
    meshes.sunFlare.renderOrder = 20;
    camHolder.add(meshes.sunFlare);
    // Create a Player instance
    var player = player_1.default(heightField, WATER_LEVEL);
    // For timing
    var prevT = Date.now(); // prev frame time (ms)
    var simT = 0; // total running time (ms)
    resize(displayWidth, displayHeight);
    // toggle logger on ` press
    input.setKeyPressListener(192, function () {
        logger.toggle();
    });
    input.setKeyPressListener('O'.charCodeAt(0), function () {
        player.state.pos.x = 0;
        player.state.pos.y = 0;
    });
    input.setKeyPressListener('F'.charCodeAt(0), function () {
        windIntensity = Math.max(windIntensity - 0.1, 0);
        var mat = meshes.grass.material;
        mat.uniforms['windIntensity'].value = windIntensity;
    });
    input.setKeyPressListener('G'.charCodeAt(0), function () {
        windIntensity = Math.min(windIntensity + 0.1, WIND_MAX);
        var mat = meshes.grass.material;
        mat.uniforms['windIntensity'].value = windIntensity;
    });
    var fpsMon = fps_1.default();
    ///////////////////////////////////////////////////////////////////
    // Public World instance methods
    /**
     * Call every frame
     */
    function doFrame() {
        var curT = Date.now();
        var dt = curT - prevT;
        fpsMon.update(dt);
        if (dt > 0) {
            // only do computations if time elapsed
            if (dt > MAX_TIMESTEP) {
                // don't exceed max timestep
                dt = MAX_TIMESTEP;
                prevT = curT - MAX_TIMESTEP;
            }
            // update sim
            update(dt);
            // render it
            render();
            // remember prev frame time
            prevT = curT;
        }
    }
    /** Handle window resize events */
    function resize(w, h) {
        displayWidth = w;
        displayHeight = h;
        renderer.setSize(displayWidth, displayHeight);
        camera.aspect = displayWidth / displayHeight;
        camera.updateProjectionMatrix();
    }
    ///////////////////////////////////////////////////////////////////
    // Private instance methods
    var _hinfo = heightfield_1.HInfo();
    var _v = vec_1.Vec2.create(0.0, 0.0);
    /**
     * Logic update
     */
    function update(dt) {
        // Intro fade from white
        if (simT < INTRO_FADE_DUR) {
            updateFade(dt);
        }
        simT += dt;
        var t = simT * 0.001;
        // Move player (viewer)
        player.update(dt);
        var ppos = player.state.pos;
        var pdir = player.state.dir;
        var pyaw = player.state.yaw;
        var ppitch = player.state.pitch;
        var proll = player.state.roll;
        heightfield_1.default.infoAt(heightField, ppos.x, ppos.y, true, _hinfo);
        var groundHeight = _hinfo.z;
        if (logger.isVisible()) {
            logger.setText("x:" + ppos.x.toFixed(4) +
                " y:" + ppos.y.toFixed(4) +
                " z:" + ppos.z.toFixed(4) +
                " dx:" + pdir.x.toFixed(4) +
                " dy:" + pdir.y.toFixed(4) +
                " dz:" + pdir.z.toFixed(4) +
                " height:" + groundHeight.toFixed(4) +
                " i:" + _hinfo.i +
                " fps:" + fpsMon.fps());
        }
        // Move skydome with player
        meshes.sky.position.x = ppos.x;
        meshes.sky.position.y = ppos.y;
        // Update grass.
        // Here we specify the centre position of the square patch to
        // be drawn. That would be directly in front of the camera, the
        // distance from centre to edge of the patch.
        var drawPos = _v;
        vec_1.Vec2.set(drawPos, ppos.x + Math.cos(pyaw) * grassPatchRadius, ppos.y + Math.sin(pyaw) * grassPatchRadius);
        grass.update(meshes.grass, t, ppos, pdir, drawPos);
        terrain_1.default.update(terra, ppos.x, ppos.y);
        water.update(meshes.water, ppos);
        // Update camera location/orientation
        vec_1.Vec3.copy(ppos, camHolder.position);
        //camHolder.position.z = ppos.z + groundHeight
        camHolder.rotation.z = pyaw;
        // Player considers 'up' pitch positive, but cam pitch (about Y) is reversed
        camHolder.rotation.y = -ppitch;
        camHolder.rotation.x = proll;
        // Update sun glare effect
        updateGlare();
    }
    /** Update how much glare effect by how much we're looking at the sun */
    function updateGlare() {
        var dy = Math.abs(gmath_1.difAngle(GLARE_YAW, player.state.yaw));
        var dp = Math.abs(gmath_1.difAngle(GLARE_PITCH, player.state.pitch)) * 1.75;
        var sunVisAngle = Math.sqrt(dy * dy + dp * dp);
        if (sunVisAngle < GLARE_RANGE) {
            var glare = MAX_GLARE * Math.pow((GLARE_RANGE - sunVisAngle) / (1.0 + MAX_GLARE), 0.75);
            meshes.sunFlare.material.opacity = Math.max(0.0, glare);
            meshes.sunFlare.visible = true;
        }
        else {
            meshes.sunFlare.visible = false;
        }
    }
    /** Update intro fullscreen fade from white */
    function updateFade(dt) {
        var mat = meshes.fade.material;
        if (simT + dt >= INTRO_FADE_DUR) {
            // fade is complete - hide cover
            mat.opacity = 0.0;
            meshes.fade.visible = false;
        }
        else {
            // update fade opacity
            mat.opacity = 1.0 - Math.pow(simT / INTRO_FADE_DUR, 2.0);
        }
    }
    function render() {
        renderer.render(scene, camera);
    }
    ///////////////////////////////////////////////////////////////////
    // Return public interface
    return {
        doFrame: doFrame,
        resize: resize
    };
}
exports.default = World;

},{"./fps":4,"./gmath":6,"./grass":7,"./heightfield":8,"./input":9,"./logger":11,"./player":14,"./skydome":16,"./terrain":17,"./terramap":18,"./util":19,"./vec":20,"./water":21}]},{},[12]);
