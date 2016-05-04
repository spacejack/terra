import {$e, $i, detectWebGL} from './util'
import {Assets, Loader} from './loader'
import * as input from './input'
import * as anim from './anim'
import * as fullscreen from './fullscreen'
import * as browser from './browser'
import {IWorld, World} from './world'

interface Config {
	blades: number
	depth: number
	antialias: boolean
}

// circa 2016
const CONFIGS: {[id:string]: Config} = {
	mobile:   {blades: 20000,  depth: 50.0, antialias: false},
	laptop:   {blades: 40000,  depth: 65.0, antialias: false},
	desktop:  {blades: 84000,  depth: 85.0, antialias: true},
	desktop2: {blades: 250000, depth: 120.0, antialias: true},
	gamerig:  {blades: 500000, depth: 170.0, antialias: true}
}

/**
 * Create App instance
 */
export default function App() {

	// DOM element containing canvas
	const container = $e('app_canvas_container')

	// Will be set correctly later
	let displayWidth = 640
	let displayHeight = 480

	let assets: Assets
	let world: IWorld

	let isFullscreen = fullscreen.is()

	/**
	 *  Call this when HTML page elements are loaded & ready
	 */
	function run() {
		if (!$e('app_canvas_container')) {
			console.error("app_canvas_container element not found in page")
			return false
		}

		if (!detectWebGL()) {
			$e('loading_text').textContent = "WebGL unavailable."
			return false
		}

		resize()
		loadAssets()
		configUI()
		window.addEventListener('resize', resize, false)
		return true
	}

	/**
	 * Configuration UI input handlers
	 */
	function configUI() {
		// Select a config roughly based on device type
		const cfgId = browser.isMobile.any ? 'mobile' : 'desktop'
		const cfg = CONFIGS[cfgId]
		const sel = $i('sel_devicepower')
		sel.value = cfgId
		const inp_blades = $i('inp_blades')
		inp_blades.value = cfg.blades.toString()
		const inp_depth = $i('inp_depth')
		inp_depth.value = cfg.depth.toString()
		$i('chk_antialias').checked = cfg.antialias
		$i('chk_fullscreen').checked = false
		$i('chk_fullscreen').onchange = function() {
			fullscreen.toggle($e('app_container'))
		}
		sel.onchange = function(e: Event) {
			const cfg = CONFIGS[sel.value]
			const b = cfg.blades.toString()
			const d = cfg.depth.toString()
			inp_blades.value = b
			inp_depth.value = d
			$e('txt_blades').textContent = b
			$e('txt_depth').textContent = d
			$i('chk_antialias').checked = cfg.antialias
		}
		$e('txt_blades').textContent = cfg.blades.toString()
		$e('txt_depth').textContent = cfg.depth.toString()
		inp_blades.onchange = function(e) {
			$e('txt_blades').textContent = inp_blades.value
		}
		inp_depth.onchange = function(e) {
			$e('txt_depth').textContent = inp_depth.value
		}
	}

	function loadAssets() {
		const loader = Loader()
		loader.load(
			{
				text: [
					{name: 'grass.vert', url: 'shader/grass.vert.glsl'},
					{name: 'grass.frag', url: 'shader/grass.frag.glsl'},
					{name: 'terrain.vert', url: 'shader/terrain.vert.glsl'},
					{name: 'terrain.frag', url: 'shader/terrain.frag.glsl'},
					{name: 'water.vert', url: 'shader/water.vert.glsl'},
					{name: 'water.frag', url: 'shader/water.frag.glsl'}
				],
				images: [
					{name: 'heightmap', url: 'data/heightmap.jpg'}
				],
				textures: [
					{name: 'grass', url: 'data/grass.jpg'},
					{name: 'skydome', url: 'data/skydome.jpg'},
					{name: 'ground', url: 'data/ground.jpg'}
				]
			},
			onAssetsLoaded,
			onAssetsProgress,
			onAssetsError
		)
	}

	function onAssetsProgress (p: number) {
		const pct = Math.floor(p * 90)
		$e('loading_bar').style.width = pct+'%'
	}

	function onAssetsError (e: string) {
		$e('loading_text').textContent = e
	}

	function onAssetsLoaded(a: Assets) {
		assets = a
		$e('loading_bar').style.width = '100%'
		$e('loading_text').innerHTML = "&nbsp;"
		setTimeout(function() {
			$e('loading_bar_outer').style.visibility = 'hidden'
			$e('config_block').style.visibility = 'visible'
			$e('btn_start').onclick = function() {
				anim.fadeOut($e('loading_block'), 80, function() {
					$e('loading_block').style.display = 'none'
					if (!isFullscreen) {
						$e('title_bar').style.display = 'block'
					}
					$e('btn_fullscreen').onclick = function() {
						fullscreen.toggle($e('app_container'))
					}
					$e('btn_restart').onclick = function() {
						document.location.reload()
					}
					start()
				})
			}
		}, 10)
	}

	/**
	 *  All stuff loaded, setup event handlers & start the app...
	 */
	function start() {
		if ($i('chk_audio').checked) {
			const au = $e('chopin') as HTMLAudioElement
			au.loop = true
			au.play()
		}
		input.init()
		// Get detail settings from UI inputs
		const numGrassBlades = +($i('inp_blades').value)
		const grassPatchRadius = +($i('inp_depth').value)
		const antialias = !!($i('chk_antialias').checked)
		// Create an instance of the world
		world = World(
			assets, numGrassBlades, grassPatchRadius,
			displayWidth, displayHeight, antialias
		)
		// Start our animation loop
		doFrame()
	}

	function doFrame() {
		// keep animation loop running
		world.doFrame()
		requestAnimationFrame(doFrame)
	}

	/** Handle window resize events */
	function resize() {
		displayWidth = container.clientWidth
		displayHeight = container.clientHeight
		if (world) {
			world.resize(displayWidth, displayHeight)
		} else {
			const canvas = $e('app_canvas') as HTMLCanvasElement
			canvas.width = displayWidth
			canvas.height = displayHeight
		}

		// Seems to be a good place to check for fullscreen toggle.
		const fs = fullscreen.is()
		if (fs !== isFullscreen) {
			// Show/hide the UI when switching windowed/FS mode.
			$e('title_bar').style.display = fs ? 'none' : 'block'
			isFullscreen = fs
		}
	}

	//  Return public interface
	return {
		run: run
	}
}
