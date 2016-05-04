// Copyright (c) 2016 by Mike Linkovich

import {$e} from './util'
import {difAngle} from './gmath'
import {Vec3, Color} from './vec'
import * as logger from './logger'
import * as input from './input'
import {Assets} from './loader'
import * as skydome from './skydome'
import * as heightfield from './heightfield'
type Heightfield = heightfield.Heightfield
import * as grass from './grass'
import * as terrain from './terrain'
import * as terramap from './terramap'
import * as water from './water'
import Player from './player'
import {FPSMonitor} from './fps'

const VIEW_DEPTH = 2000.0

const MAX_TIMESTEP = 67 // max 67 ms/frame

const HEIGHTFIELD_SIZE = 3072.0
const HEIGHTFIELD_HEIGHT = 180.0

const LIGHT_DIR = Vec3.create(0.0, 1.0, -1.0)
Vec3.normalize(LIGHT_DIR, LIGHT_DIR)

const FOG_COLOR = Color.create(0.74, 0.77, 0.91) //(0.92, 0.94, 0.98)
const GRASS_COLOR_LOW = Color.create(0.34, 0.37, 0.18)
const GRASS_COLOR_HIGH = Color.create(0.48, 0.46, 0.18)

const WATER_LEVEL = 55.0
const WATER_COLOR = Color.create(0.6, 0.7, 0.85) // THREE.Color(0.2, 0.36, 0.51)

const MAX_GLARE = 0.25 // max glare effect amount
const GLARE_RANGE = 1.1 // angular range of effect
const GLARE_YAW = Math.PI * 1.5 // yaw angle when looking directly at sun
const GLARE_PITCH = 0.2 // pitch angle looking at sun
const GLARE_COLOR = Color.create(1.0, 1.0, 0.75) // 0xFFF844

const INTRO_FADE_DUR = 2000

export interface IWorld {
	doFrame() : void
	resize(w: number, h: number) : void
}

interface MeshSet {
	terrain: THREE.Mesh
	grass: THREE.Mesh
	sky: THREE.Mesh
	water: THREE.Mesh
	sunFlare: THREE.Mesh
	fade: THREE.Mesh // used for intro fade from white
}

///////////////////////////////////////////////////////////////////////
/**
 * Create a World instance
 */
export function World ( assets: Assets,
	numGrassBlades: number, grassPatchRadius: number,
	displayWidth: number, displayHeight: number,
	antialias: boolean
) : IWorld {

	const canvas = $e('app_canvas') as HTMLCanvasElement

	// Make canvas transparent so it isn't rendered as black for 1 frame at startup
	const renderer = new THREE.WebGLRenderer({
		canvas: canvas, antialias: antialias, clearColor: 0xFFFFFF, clearAlpha: 1, alpha: true
	})
	if (!renderer) {
		console.error("Failed to create THREE.WebGLRenderer")
		return null
	}

	// Setup some render values based on provided configs
	const fogDist = grassPatchRadius * 20.0
	const grassFogDist = grassPatchRadius * 2.0
	const camera = new THREE.PerspectiveCamera(
		45, displayWidth / displayHeight, 1.0, VIEW_DEPTH
	)
	const meshes: MeshSet = {
		terrain: null, grass: null, sky: null, water: null, sunFlare: null, fade: null
	}

	const scene = new THREE.Scene()
	scene.fog = new THREE.Fog(Color.to24bit(FOG_COLOR), 0.1, fogDist)

	// Setup the camera so Z is up.
	// Then we have cartesian X,Y coordinates along ground plane.
	camera.rotation.order = "ZXY"
	camera.rotation.x = Math.PI * 0.5
	camera.rotation.y = Math.PI * 0.5
	camera.rotation.z = Math.PI
	camera.up.set(0.0, 0.0, 1.0)

	// Put camera in an object so we can transform it normally
	const camHolder = new THREE.Object3D()
	camHolder.rotation.order = "ZYX"
	camHolder.add(camera)

	scene.add(camHolder)

	// Prevent three from sorting objs, we'll add them to the scene
	// in the order we want them drawn, because we know grass is in front
	// of everything, ground in front of sky, and transparent fullscreen
	// overlays get drawn last.
	renderer.sortObjects = false

	// Setup heightfield
	//let hfImg = assets.textures['heightmap'].image as HTMLImageElement
	let hfImg = assets.images['heightmap']
	const hfCellSize = HEIGHTFIELD_SIZE / hfImg.width
	const heightMapScale = Vec3.create(
		1.0 / HEIGHTFIELD_SIZE,
		1.0 / HEIGHTFIELD_SIZE,
		HEIGHTFIELD_HEIGHT
	)
	const heightField = heightfield.create({
		cellSize: hfCellSize,
		minHeight: 0.0,
		maxHeight: heightMapScale.z,
		image: hfImg
	})
	hfImg = null

	const terraMap = terramap.createTexture(heightField, LIGHT_DIR)

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
		grassColorLow: GRASS_COLOR_LOW,
		grassColorHigh: GRASS_COLOR_HIGH
	})
	scene.add(meshes.grass)

	// Create repeating-textured ground plane with
	// custom fog to blend with grass in distance
	//meshes.terrain = terrain.createMesh({
	const terra = terrain.create({
		texture: assets.textures['ground'],
		vertScript: assets.text['terrain.vert'],
		fragScript: assets.text['terrain.frag'],
		heightMap: terraMap,
		heightMapScale: heightMapScale,
		fogColor: FOG_COLOR,
		fogFar: fogDist,
		grassFogFar: grassFogDist,
		grassColorLow: GRASS_COLOR_LOW,
		grassColorHigh: GRASS_COLOR_HIGH
	})
	meshes.terrain = terra.mesh
	scene.add(meshes.terrain)

	// Skydome
	meshes.sky = skydome.createMesh(assets.textures['skydome'], VIEW_DEPTH * 0.95, VIEW_DEPTH * 0.95)
	scene.add(meshes.sky)
	meshes.sky.position.z = -25.0

	meshes.water = water.createMesh({
		envMap: assets.textures['skydome'],
		vertScript: assets.text['water.vert'],
		fragScript: assets.text['water.frag'],
		waterLevel: WATER_LEVEL,
		waterColor: WATER_COLOR,
		fogColor: FOG_COLOR,
		fogNear: 1.0,
		fogFar: fogDist
	})
	/*new THREE.Mesh(
		new THREE.PlaneBufferGeometry(100000.0, 100000.0),
		new THREE.MeshBasicMaterial({color: WATER_COLOR.getHex(), fog: true})
	)*/
	scene.add(meshes.water)
	meshes.water.position.z = WATER_LEVEL

	// White plane to cover screen for fullscreen fade-in from white
	meshes.fade = new THREE.Mesh(
		new THREE.PlaneBufferGeometry(6.0, 4.0, 1, 1),
		new THREE.MeshBasicMaterial({
			color: 0xFFFFFF, fog: false, transparent: true, opacity: 1.0,
			depthTest: false, depthWrite: false
		})
	)
	meshes.fade.position.x = 2.0  // place directly in front of camera
	meshes.fade.rotation.y = Math.PI * 1.5
	camHolder.add(meshes.fade)

	// Bright yellow plane for sun glare using additive blending
	// to blow out the colours
	meshes.sunFlare = new THREE.Mesh(
		new THREE.PlaneBufferGeometry(6.0, 4.0, 1, 1),
		new THREE.MeshBasicMaterial({
			color: Color.to24bit(GLARE_COLOR), fog: false, transparent: true, opacity: 0.0,
			depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending
		})
	)
	meshes.sunFlare.position.x = 2.05
	meshes.sunFlare.rotation.y = Math.PI * 1.5
	meshes.sunFlare.visible = false
	camHolder.add(meshes.sunFlare)

	// Create a Player instance
	const player = Player(heightField, WATER_LEVEL)

	// For timing
	let prevT = Date.now() // prev frame time (ms)
	let simT = 0 // total running time (ms)

	resize(displayWidth, displayHeight)

	// toggle logger on ` press
	input.setKeyPressListener(192, function() {
		logger.toggle()
	})

	input.setKeyPressListener('O'.charCodeAt(0), function() {
		player.state.pos.x = 0
		player.state.pos.y = 0
	})

	const fpsMon = FPSMonitor()

	///////////////////////////////////////////////////////////////////
	// Public World instance methods

	/**
	 * Call every frame
	 */
	function doFrame() {
		const curT = Date.now()
		let dt = curT - prevT
		fpsMon.update(dt)

		if (dt > 0) {
			// only do computations if time elapsed
			if (dt > MAX_TIMESTEP) {
				// don't exceed max timestep
				dt = MAX_TIMESTEP
				prevT = curT - MAX_TIMESTEP
			}
			// update sim
			update(dt)
			// render it
			render()
			// remember prev frame time
			prevT = curT
		}
	}

	/** Handle window resize events */
	function resize(w: number, h: number) {
		displayWidth = w
		displayHeight = h
		renderer.setSize(displayWidth, displayHeight)
		camera.aspect = displayWidth / displayHeight
		camera.updateProjectionMatrix()
	}

	///////////////////////////////////////////////////////////////////
	// Private instance methods

	const _hinfo = heightfield.HInfo.create()

	/**
	 * Logic update
	 */
	function update (dt: number) {
		// Intro fade from white
		if (simT < INTRO_FADE_DUR) {
			updateFade(dt)
		}

		simT += dt
		const t = simT * 0.001

		// Move player (viewer)
		player.update(dt)
		const ppos = player.state.pos
		const pyaw = player.state.yaw
		const ppitch = player.state.pitch
		const proll = player.state.roll

		heightfield.infoAt(heightField, ppos.x, ppos.y, true, _hinfo)
		const groundHeight = _hinfo.z

		if (logger.isVisible()) {
			logger.setText(
				"x:" + ppos.x.toFixed(4) +
				" y:" + ppos.y.toFixed(4) +
				" z:" + ppos.z.toFixed(4) +
				" height:"+groundHeight.toFixed(4) +
				" i:"+_hinfo.i +
				" fps:"+fpsMon.fps()
			)
		}

		// Move skydome with player
		meshes.sky.position.x = ppos.x
		meshes.sky.position.y = ppos.y

		// Update grass.
		// Here we specify the centre position of the square patch to
		// be drawn. That would be directly in front of the camera, the
		// distance from centre to edge of the patch.
		grass.update(
			meshes.grass, t,
			ppos.x + Math.cos(pyaw) * grassPatchRadius,
			ppos.y + Math.sin(pyaw) * grassPatchRadius
		)

		terrain.update(terra, ppos.x, ppos.y)

		water.update(meshes.water, ppos)

		// Update camera location/orientation
		Vec3.copy(ppos, camHolder.position)
		//camHolder.position.z = ppos.z + groundHeight
		camHolder.rotation.z = pyaw
		// Player considers 'up' pitch positive, but cam pitch (about Y) is reversed
		camHolder.rotation.y = -ppitch
		camHolder.rotation.x = proll

		// Update sun glare effect
		updateGlare()
	}

	/** Update how much glare effect by how much we're looking at the sun */
	function updateGlare() {
		const dy = Math.abs(difAngle(GLARE_YAW, player.state.yaw))
		const dp = Math.abs(difAngle(GLARE_PITCH, player.state.pitch)) * 1.375
		const sunVisAngle = Math.sqrt(dy * dy + dp * dp)
		if (sunVisAngle < GLARE_RANGE) {
			const glare = MAX_GLARE * Math.pow((GLARE_RANGE - sunVisAngle) / (1.0 + MAX_GLARE), 0.75)
			meshes.sunFlare.material.opacity = Math.max(0.0, glare)
			meshes.sunFlare.visible = true
		} else {
			meshes.sunFlare.visible = false
		}
	}

	/** Update intro fullscreen fade from white */
	function updateFade(dt: number) {
		if (simT + dt >= INTRO_FADE_DUR) {
			// fade is complete - hide cover
			meshes.fade.material.opacity = 0.0
			meshes.fade.visible = false
		} else {
			// update fade opacity
			meshes.fade.material.opacity = 1.0 - Math.pow(simT / INTRO_FADE_DUR, 2.0)
		}
	}

	function render () {
		renderer.render(scene, camera)
	}

	///////////////////////////////////////////////////////////////////
	// Return public interface
	return {
		doFrame: doFrame,
		resize: resize
	}
}
