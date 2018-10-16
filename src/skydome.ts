/// <reference path="types/three-global.d.ts" />

export function createMesh (
	tex: THREE.Texture, radius: number, lats = 16, lngs = 32
) {
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping
	return new THREE.Mesh(
		new THREE.SphereGeometry(
			radius, lngs, lats, 0, Math.PI * 2.0, 0, Math.PI / 2.0
		).rotateX(Math.PI / 2.0).rotateZ(Math.PI),

		new THREE.MeshBasicMaterial({
			color: 0xFFFFFF, side: THREE.BackSide, map: tex, fog: false
		})
	)
}
