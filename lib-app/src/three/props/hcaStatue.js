// src/three/props/hcaStatue.js
import * as THREE from "three";
import { loadGLTF, fixGLTFMaterials } from "../loaders/gltf.js";
import HCA_STATUE from "../../assets/props/hca_statue.glb";

/**
 * Places the Hans Christian Andersen statue in front of the library.
 * Auto-scales to a compact target height and centers it on a small pedestal.
 *
 * @param {THREE.Scene} scene
 * @param {GLTFLoader} gltfLoader
 * @param {(x:number,z:number)=>number} heightAt
 * @param {{
 *   x?: number,
 *   z?: number,
 *   rotationY?: number,
 *   scale?: number,             // if set, overrides auto scaling
 *   targetHeight?: number,      // desired statue height (meters, no pedestal)
 *   pedestal?: { w?: number, h?: number, d?: number, color?: number }
 * }} [opts]
 * @returns {Promise<{dispose:()=>void}>}
 */
export async function addHCAStatue(scene, gltfLoader, heightAt, opts = {}) {
  // Centered to the room span (room walls: x ~ -0.5..15.5). Front is +Z.
  const {
    x = 7.5,
    z = 1.4, // a little closer to the carpet edge
    rotationY = Math.PI,
    // Smaller by default: ~1.0 m tall statue body
    targetHeight = 1.0,
    // Smaller pedestal so the whole composition reads modestly
    pedestal = { w: 0.55, h: 0.22, d: 0.55, color: 0x7a8a96 },
    // If you need a hard override, pass scale explicitly
    scale,
  } = opts;

  const groundY = typeof heightAt === "function" ? heightAt(x, z) : 0;

  // Pedestal
  const pedGeo = new THREE.BoxGeometry(
    pedestal.w ?? 0.55,
    pedestal.h ?? 0.22,
    pedestal.d ?? 0.55
  );
  const pedMat = new THREE.MeshStandardMaterial({
    color: pedestal.color ?? 0x7a8a96,
    roughness: 0.95,
    metalness: 0.0,
  });
  const pedestalMesh = new THREE.Mesh(pedGeo, pedMat);
  pedestalMesh.castShadow = true;
  pedestalMesh.receiveShadow = true;
  pedestalMesh.position.set(x, groundY + (pedestal.h ?? 0.22) / 2, z);
  scene.add(pedestalMesh);

  // Load statue
  const gltf = await loadGLTF(gltfLoader, HCA_STATUE);
  const statue = gltf.scene;
  fixGLTFMaterials(statue);

  // Normalize with a pivot
  const pivot = new THREE.Group();

  // Original bounds
  const box = new THREE.Box3().setFromObject(statue);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  // Scale to target height unless an explicit scale is provided
  let s = 1;
  if (typeof scale === "number") {
    s = scale;
  } else if (size.y > 0) {
    s = targetHeight / size.y;
  }
  statue.scale.setScalar(s);

  // Recompute bounds after scaling
  const box2 = new THREE.Box3().setFromObject(statue);
  const center2 = new THREE.Vector3();
  box2.getCenter(center2);

  // Lift base to y=0 in the pivot and center X/Z
  const baseY = box2.min.y;
  statue.position.x += -center2.x;
  statue.position.z += -center2.z;
  statue.position.y += -baseY;

  // Place pivot on top of pedestal
  pivot.add(statue);
  pivot.position.set(x, groundY + (pedestal.h ?? 0.22), z);
  pivot.rotation.y = rotationY;
  scene.add(pivot);

  // Bronze tint only for pure-black, untextured parts
  pivot.traverse((o) => {
    if (o.isMesh && o.material && !o.material.map) {
      const col = o.material.color?.getHex?.();
      if (col === 0x000000) {
        o.material.color.set(0x7b6a58);
        o.material.roughness = 0.85;
        o.material.metalness = 0.25;
        o.material.needsUpdate = true;
      }
    }
  });

  return {
    dispose() {
      scene.remove(pivot);
      scene.remove(pedestalMesh);
      pivot.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose?.();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m?.dispose?.());
        }
      });
      pedGeo.dispose();
      pedMat.dispose();
    },
  };
}
