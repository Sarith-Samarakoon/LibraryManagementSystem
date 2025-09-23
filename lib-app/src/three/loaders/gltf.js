import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

export function makeGLTFLoader(renderer) {
  const loader = new GLTFLoader();

  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  loader.setDRACOLoader(draco);

  const ktx2 = new KTX2Loader();
  ktx2.setTranscoderPath("/basis/");
  if (renderer) ktx2.detectSupport(renderer);
  loader.setKTX2Loader(ktx2);

  return loader;
}

export function fixGLTFMaterials(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if (!m) return;

      // if baseColor is black but a map exists, bump to white
      if (m.color && m.color.equals?.(new THREE.Color(0x000000)) && m.map) {
        m.color.set(0xffffff);
      }

      if (m.map && "colorSpace" in m.map)
        m.map.colorSpace = THREE.SRGBColorSpace;
      if (m.emissiveMap && "colorSpace" in m.emissiveMap)
        m.emissiveMap.colorSpace = THREE.SRGBColorSpace;

      if (typeof m.roughness !== "number") m.roughness = 0.9;
      if (typeof m.metalness !== "number") m.metalness = 0.0;
      if ("envMapIntensity" in m) m.envMapIntensity = 1.0;

      m.needsUpdate = true;
    });
    o.castShadow = true;
    o.receiveShadow = true;
    o.frustumCulled = false; // skinned/animated safety
  });
}

export function loadGLTF(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        fixGLTFMaterials(gltf.scene);
        resolve(gltf);
      },
      undefined,
      reject
    );
  });
}
