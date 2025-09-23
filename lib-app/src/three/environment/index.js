import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import { makeTextureLoaders } from "../utils/textures.js";

import GRASS from "../../assets/grass.jpg";
import DIRT from "../../assets/dirt.jpg";
import CLOUDS from "../../assets/sky/clouds.jpg";

export function createEnvironment(scene, renderer) {
  const { loadSRGB } = makeTextureLoaders(renderer);

  // PMREM environment for PBR
  try {
    const pmremGen = new THREE.PMREMGenerator(renderer);
    const skyTex = loadSRGB(CLOUDS);
    skyTex.mapping = THREE.EquirectangularReflectionMapping;

    const envRT = pmremGen.fromEquirectangular(skyTex);
    scene.environment = envRT.texture; // PBR lighting
    scene.background = skyTex; // keep the image background

    pmremGen.dispose();
  } catch {
    scene.background = new THREE.Color(0x9ec3ff);
  }

  // terrain textures
  const grass = loadSRGB(GRASS);
  const dirt = loadSRGB(DIRT);
  [grass, dirt].forEach((t) => {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
  });

  // ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 220),
    new THREE.MeshStandardMaterial({ map: grass, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // distant hills
  let noise;
  const hills = new THREE.Group();
  let hasHills = false;
  try {
    noise = new ImprovedNoise();
  } catch {}

  if (noise) {
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    for (let x = -40; x <= 40; x += 2) {
      for (let z = 24; z <= 80; z += 2) {
        const h = Math.max(
          0,
          Math.floor((noise.noise(x * 0.08, 0, z * 0.08) + 1) * 1.7)
        );
        for (let y = 0; y < h; y++) {
          const mat = new THREE.MeshStandardMaterial({
            map: y === h - 1 ? grass : dirt,
            roughness: 0.95,
          });
          const cube = new THREE.Mesh(boxGeo, mat);
          cube.position.set(x, y + 0.5, -z);
          cube.castShadow = cube.receiveShadow = true;
          hills.add(cube);
        }
      }
    }
    hasHills = true;
    scene.add(hills);
  }

  return { ground, hills: hasHills ? hills : null };
}
