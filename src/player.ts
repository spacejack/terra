// Copyright (c) 2016 by Mike Linkovich

import {clamp, sign} from './gmath'
import {Vec2, Vec3} from './vec'
import * as input from './input'
import notify from './notification'
import Heightfield from './heightfield'
import * as log from './logger'

const DEFAULT_HEIGHT = 0.0
const MIN_HEIGHT = 2.5
const MAX_HEIGHT = 275.0
const FLOAT_VEL = 0.75
const BOB_RANGE = 16.0
const DEFAULT_PITCH = -0.325
const MOVE_RANGE = 1500.0

const ACCEL = 90.0 // forward accel
const DRAG = 0.1
const VACCEL = 60.0 // vertical accel
const VDRAG = 5.0
const YAW_ACCEL = 4.0 // angular accel (yaw)
const YAW_DRAG = 2.0
const PITCH_ACCEL = 4.0
const PITCH_RESIST = 16.0
const PITCH_FRIC = 8.0
const ROLL_ACCEL = 2.0
const ROLL_RESIST = 10.0
const ROLL_FRIC = 8.0

const MAN_VEL = 40.0
const MAN_ZVEL = 10.0
const MAN_YAWVEL = 0.5
const MAN_PITCHVEL = 0.5
const MAN_MAXPITCH = Math.PI / 4.0

const MODE_AUTO = 0
const MODE_FLY  = 1
const MODE_MAN  = 2
const NUM_MODES = 3

/** Creates a Player instance (User first person camera) */
function Player (heightField: Heightfield, waterHeight: number) {

	//let autoplay = true
	let mode = MODE_AUTO
	let curT = 0

	const state = {
		pos: Vec3.create(0.0, 0.0, DEFAULT_HEIGHT),
		vel: Vec3.create(0.0, 0.0, 0.0),
		dir: Vec3.create(1.0, 0.0, 0.0),
		yaw: 0.0,
		yawVel: 0.0,
		pitch: 0.0,
		pitchVel: 0.0,
		roll: 0.0,
		rollVel: 0.0,
		floatHeight: 0.0
	}

	input.setKeyPressListener(13, function() {
		nextMode()
		if (mode === MODE_AUTO) {
			log.hide()
			notify('Press ENTER to change camera')
		} else if (mode === MODE_FLY) {
			notify('ARROWS drive, W/S move up/down.')
		} else if (mode === MODE_MAN) {
			log.show()
			notify('ARROWS move, W/S move up/down, Q/A look up/down')
		}
	})

	// scratchpad vectors
	const _a = Vec3.create()
	const _d = Vec3.create()
	const _p1 = Vec3.create()
	const _p2 = Vec3.create()
	const _p3 = Vec3.create()

	/**
	 * @param dt Delta time in ms
	 */
	function update(dt: number) {
		curT += dt
		// Update auto or manual
		if (mode === MODE_AUTO) {
			updateAuto(curT / 1000.0, dt)
		} else if (mode === MODE_FLY) {
			updateDrone(input.state, dt)
		} else if (mode === MODE_MAN) {
			updateManual(input.state, dt)
		}
		// Calc cam look direction vector
		const d = state.dir
		d.z = Math.sin(state.pitch)
		const s = (1.0 - Math.abs(d.z))
		d.x = Math.cos(state.yaw) * s
		d.y = Math.sin(state.yaw) * s
	}

	function nextMode() {
		mode = (mode + 1) % NUM_MODES
		if (mode === MODE_MAN) {
			state.roll = 0
			state.rollVel = 0
			state.pitchVel = 0
			state.yawVel = 0
		}
	}

	function getMode() {
		return mode
	}

	/**
	 * Update autoplay camera
	 * @param time Time in seconds
	 */
	function updateAuto (time: number, dt: number) {
		const ft = dt / 1000.0

		// Remember last frame values
		Vec3.copy(state.pos, _a)
		const yaw0 = state.yaw
		const pitch0 = state.pitch

		// Follow a nice curvy path...
		//state.pos.x = Math.cos(r) * MOVE_RANGE + Math.sin(r) * MOVE_RANGE * 2.0
		//state.pos.y = Math.sin(r) * MOVE_RANGE + Math.cos(r) * MOVE_RANGE * 2.0
		autoPos(time * 0.01, state.pos)
		// Look ahead a few steps so we can see if there are
		// sudden height increases to look for
		autoPos((time + 1.0) * 0.01, _p1)
		autoPos((time + 2.0) * 0.01, _p2)
		autoPos((time + 3.0) * 0.01, _p3)

		// Move up & down smoothly
		const a = time * 0.3
		state.pos.z = BOB_RANGE + Math.cos(a) * BOB_RANGE
		// Look up & down depending on height
		state.pitch = DEFAULT_PITCH - 0.25 * Math.sin(a + Math.PI * 0.5)

		// Turn left & right smoothly over time
		state.yaw = Math.sin(time * 0.04) * Math.PI * 2.0 + Math.PI * 0.5

		// Actual height at camera
		const groundHeight = Math.max(
			Heightfield.heightAt(heightField, state.pos.x, state.pos.y, true),
			waterHeight
		)
		// Look ahead heights
		const h1 = Math.max(
			Heightfield.heightAt(heightField, _p1.x, _p1.y, true),
			waterHeight
		)
		const h2 = Math.max(
			Heightfield.heightAt(heightField, _p2.x, _p2.y, true),
			waterHeight
		)
		const h3 = Math.max(
			Heightfield.heightAt(heightField, _p3.x, _p3.y, true),
			waterHeight
		)
		//let minHeight = (groundHeight + h1 + h2 + h3) / 4.0
		const minHeight = Math.max(Math.max(Math.max(groundHeight, h1), h2), h3)
		let floatVel = (state.floatHeight < minHeight) ?
			(minHeight - state.floatHeight) : (groundHeight - state.floatHeight)
		if (floatVel < 0) {
			floatVel *= 0.25 // can sink more slowly
		}
		state.floatHeight += floatVel * FLOAT_VEL * ft
		// Make absolutely sure we're above ground
		if (state.floatHeight < groundHeight)
			state.floatHeight = groundHeight
		state.pos.z += state.floatHeight + MIN_HEIGHT

		// Calc velocities based on difs from prev frame
		_d.x = state.pos.x - _a.x
		_d.y = state.pos.y - _a.y
		_d.z = state.pos.z - _a.z
		state.vel.x = _d.x / ft
		state.vel.y = _d.y / ft
		state.vel.z = _d.z / ft
		const dyaw = state.yaw - yaw0
		state.yawVel = dyaw / ft
		const dpitch = state.pitch - pitch0
		state.pitchVel = dpitch / ft
	}

	function autoPos(r: number, p: Vec2) {
		p.x = Math.cos(r) * MOVE_RANGE + Math.sin(r) * MOVE_RANGE * 2.0
		p.y = Math.sin(r) * MOVE_RANGE + Math.cos(r) * MOVE_RANGE * 2.0
	}

	/**
	 * Drone-like physics
	 */
	function updateDrone (i: input.State, dt: number) {
		// Delta time in seconds
		const ft = dt / 1000.0

		// calc roll accel
		let ra = 0
		if (i.left > 0) {
			ra = -ROLL_ACCEL
		} else if (i.right > 0) {
			ra = ROLL_ACCEL
		}
		// calc roll resist forces
		const rr = -state.roll * ROLL_RESIST
		const rf = -sign(state.rollVel) * ROLL_FRIC * Math.abs(state.rollVel)
		// total roll accel
		ra = ra + rr + rf
		state.rollVel += ra * ft
		state.roll += state.rollVel * ft

		// Calc yaw accel
		const ya = -state.roll * YAW_ACCEL
		// yaw drag
		const yd = -sign(state.yawVel) * Math.abs(Math.pow(state.yawVel, 3.0)) * YAW_DRAG
		// update yaw
		state.yawVel += (ya + yd) * ft
		state.yaw += state.yawVel * ft

		// Calc pitch accel
		let pa = 0
		if (i.forward > 0) {
			pa = -PITCH_ACCEL
		} else if (i.back > 0) {
			pa = PITCH_ACCEL * 0.5
		}
		// Calc pitch resist forces
		const pr = -state.pitch * PITCH_RESIST
		const pf = -sign(state.pitchVel) * PITCH_FRIC * Math.abs(state.pitchVel)
		// total pitch accel
		pa = pa + pr + pf
		state.pitchVel += pa * ft
		state.pitch += state.pitchVel * ft

		// Calc accel vector
		Vec3.set(_a, 0, 0, 0)
		_a.x = -state.pitch * ACCEL * Math.cos(state.yaw)
		_a.y = -state.pitch * ACCEL * Math.sin(state.yaw)
		// Calc drag vector (horizontal)
		const absVel = Vec2.length(state.vel) // state.vel.length()
		_d.x = -state.vel.x
		_d.y = -state.vel.y
		Vec2.setLength(_d, absVel * DRAG, _d)

		// Calc vertical accel
		if (i.up > 0 && state.pos.z < MAX_HEIGHT - 2.0) {
			_a.z = VACCEL
		} else if (i.down > 0 && state.pos.z > MIN_HEIGHT) {
			_a.z = -VACCEL
		}
		_d.z = -state.vel.z * VDRAG

		// update vel
		state.vel.x += (_a.x + _d.x) * ft
		state.vel.y += (_a.y + _d.y) * ft
		state.vel.z += (_a.z + _d.z) * ft
		// update pos
		state.pos.x += state.vel.x * ft
		state.pos.y += state.vel.y * ft
		state.pos.z += state.vel.z * ft
		const groundHeight = Math.max(
			Heightfield.heightAt(heightField, state.pos.x, state.pos.y, true),
			waterHeight
		)
		if (state.pos.z < groundHeight + MIN_HEIGHT) {
			state.pos.z = groundHeight + MIN_HEIGHT
		} else if (state.pos.z > MAX_HEIGHT) {
			state.pos.z = MAX_HEIGHT
		}
	}

	/**
	 * Manual movement
	 */
	function updateManual (i: input.State, dt: number) {
		const ft = dt / 1000.0

		state.yawVel = 0
		if (i.left) {
			state.yawVel = MAN_YAWVEL
		} else if (i.right) {
			state.yawVel = -MAN_YAWVEL
		}
		state.yaw += state.yawVel * ft

		state.pitchVel = 0
		if (i.pitchup) {
			state.pitchVel = MAN_PITCHVEL
		} else if (i.pitchdown) {
			state.pitchVel = -MAN_PITCHVEL
		}
		state.pitch += state.pitchVel * ft
		state.pitch = clamp(state.pitch, -MAN_MAXPITCH, MAN_MAXPITCH)

		Vec3.set(state.vel, 0, 0, 0)
		if (i.forward) {
			state.vel.x = MAN_VEL * Math.cos(state.yaw)
			state.vel.y = MAN_VEL * Math.sin(state.yaw)
		} else if (i.back) {
			state.vel.x = -MAN_VEL * Math.cos(state.yaw)
			state.vel.y = -MAN_VEL * Math.sin(state.yaw)
		}
		state.pos.x += state.vel.x * ft
		state.pos.y += state.vel.y * ft

		if (i.up) {
			state.vel.z = MAN_ZVEL
		} else if (i.down) {
			state.vel.z = -MAN_ZVEL
		}
		state.pos.z += state.vel.z * ft

		const groundHeight = Math.max(
			Heightfield.heightAt(heightField, state.pos.x, state.pos.y, true),
			waterHeight
		)
		if (state.pos.z < groundHeight + MIN_HEIGHT) {
			state.pos.z = groundHeight + MIN_HEIGHT
		} else if (state.pos.z > MAX_HEIGHT) {
			state.pos.z = MAX_HEIGHT
		}
	}

	/**
	 * Public interface
	 */
	return {
		update,
		state,
		getMode,
		nextMode
	}
}

interface Player extends ReturnType<typeof Player> {}

export default Player
