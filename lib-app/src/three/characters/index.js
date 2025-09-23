// src/three/characters/index.js
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { fixGLTFMaterials, loadGLTF } from "../loaders/gltf.js";

// humans
import HUMAN_WALK from "../../assets/humans/walk.glb";
import HUMAN_IDLE from "../../assets/humans/walk.glb"; // keep as-is if your idle file isn't available
import HUMAN_SIT from "../../assets/humans/sit.glb";

// creatures
import GORGOSAURUS from "../../assets/creatures/gorgosaurus.glb";
// shrek (Sketchfab walk cycle you downloaded)
import SHREK_WALK from "../../assets/humans/shrek_walk.glb";

export async function initCharacters(scene, gltfLoader, heightAt) {
  const mixers = [];
  const group = new THREE.Group();
  scene.add(group);

  function findWalkClip(anims) {
    if (!anims || !anims.length) return null;
    const needles = ["walk", "walking", "walkcycle", "walk_cycle"];
    const lower = (s) => s.toLowerCase();
    for (const n of needles) {
      const hit = anims.find((c) => lower(c.name).includes(n));
      if (hit) return hit.name;
    }
    return anims[0].name;
  }

  function playClipOn(root, anims, name, speed = 1) {
    if (!anims || !anims.length) return null;
    const clip =
      (name && THREE.AnimationClip.findByName(anims, name)) || anims[0];
    const mixer = new THREE.AnimationMixer(root);
    const action = mixer.clipAction(clip);
    action.play();
    action.setEffectiveTimeScale(speed);
    mixers.push({ mixer, speed });
    return mixer;
  }

  function spawnCloned(baseGltf, cfg) {
    if (!baseGltf) return null;
    const root = SkeletonUtils.clone(baseGltf.scene);
    fixGLTFMaterials(root);
    group.add(root);

    root.position.copy(cfg.position || new THREE.Vector3());
    root.rotation.y = cfg.rotationY || 0;
    root.scale.setScalar(cfg.scale ?? 1);

    if (cfg.clip || (baseGltf.animations && baseGltf.animations.length)) {
      playClipOn(root, baseGltf.animations, cfg.clip, cfg.speed ?? 1);
    }
    if (cfg.patrol) {
      root.userData.patrol = {
        from: cfg.patrol.from.clone(),
        to: cfg.patrol.to.clone(),
        metersPerSec: cfg.patrol.metersPerSec || 1,
        dir: cfg.patrol.dir || 1,
      };
    }
    return root;
  }

  const base = {
    walk: null,
    idle: null,
    sit: null,
    dino: null,
    shrek: null,
  };

  // load every base (missing files will just log and be skipped)
  const safeLoad = async (key, url) => {
    try {
      base[key] = await loadGLTF(gltfLoader, url);
    } catch (e) {
      console.error(`Failed to load ${key}`, e);
    }
  };

  await Promise.all([
    safeLoad("walk", HUMAN_WALK),
    safeLoad("idle", HUMAN_IDLE),
    safeLoad("sit", HUMAN_SIT),
    safeLoad("dino", GORGOSAURUS),
    safeLoad("shrek", SHREK_WALK),
  ]);

  // scales
  const SCALE = {
    human: 0.9,
    idle: 0.9,
    sit: 0.9,
    dino: 1.6,
    shrek: 0.9,
  };

  const rand = (a, b) => Math.random() * (b - a) + a;
  function chooseBackgroundXZ(xMin = -28, xMax = 28, zNear = -28, zFar = -110) {
    const x = rand(xMin, xMax);
    const z = -rand(-zFar, -zNear); // negative Z behind the library
    return { x, z: -Math.abs(z) };
  }

  // walkers
  if (base.walk) {
    const NUM_WALKERS = 8;
    const name = findWalkClip(base.walk.animations);
    for (let i = 0; i < NUM_WALKERS; i++) {
      const { x: xA, z } = chooseBackgroundXZ();
      const xB = xA + rand(-8, 8);
      const yA = heightAt(xA, z);
      const yB = heightAt(xB, z);
      spawnCloned(base.walk, {
        clip: name,
        speed: rand(0.85, 1.25),
        position: new THREE.Vector3(xA, yA, z),
        rotationY: xB > xA ? 0 : Math.PI,
        scale: SCALE.human,
        patrol: {
          from: new THREE.Vector3(xA, yA, z),
          to: new THREE.Vector3(xB, yB, z),
          metersPerSec: 1.2,
          dir: 1,
        },
      });
    }
  }

  // idlers
  if (base.idle) {
    const NUM_IDLERS = 6;
    const name = base.idle.animations?.[0]?.name || "Idle";
    for (let i = 0; i < NUM_IDLERS; i++) {
      const { x, z } = chooseBackgroundXZ();
      const y = heightAt(x, z);
      spawnCloned(base.idle, {
        clip: name,
        speed: rand(0.9, 1.1),
        position: new THREE.Vector3(x, y, z),
        rotationY: rand(0, Math.PI * 2),
        scale: SCALE.idle,
      });
    }
  }

  // sitter on the distant hills
  if (base.sit) {
    const { x: sx, z: sz } = chooseBackgroundXZ(-22, 22, -50, -110);
    const sy = heightAt(sx, sz) + 0.02;
    const name = base.sit.animations?.[0]?.name || "Sit";
    spawnCloned(base.sit, {
      clip: name,
      speed: 1,
      position: new THREE.Vector3(sx, sy, sz),
      rotationY: Math.PI,
      scale: SCALE.sit,
    });
  }

  // shrek walkers
  if (base.shrek) {
    const COUNT = 6;
    const name = findWalkClip(base.shrek.animations);
    for (let i = 0; i < COUNT; i++) {
      const { x: xA, z } = chooseBackgroundXZ(-30, 30, -35, -95);
      const xB = xA + rand(-10, 10);
      const yA = heightAt(xA, z);
      const yB = heightAt(xB, z);
      spawnCloned(base.shrek, {
        clip: name,
        speed: rand(0.9, 1.15),
        position: new THREE.Vector3(xA, yA, z),
        rotationY: xB > xA ? 0 : Math.PI,
        scale: SCALE.shrek,
        patrol: {
          from: new THREE.Vector3(xA, yA, z),
          to: new THREE.Vector3(xB, yB, z),
          metersPerSec: 1.0,
          dir: 1,
        },
      });
    }
  }

  // gorgosaurus in the far background
  if (base.dino) {
    const dx = rand(-18, 18);
    const dz = -rand(70, 110);
    const dy = heightAt(dx, dz);
    const dino = spawnCloned(base.dino, {
      clip: base.dino.animations?.[0]?.name || "",
      speed: 1,
      position: new THREE.Vector3(dx, dy, dz),
      rotationY: rand(0, Math.PI * 2),
      scale: SCALE.dino,
    });
    if (dino) {
      const toX = dx + rand(5, 10);
      const toZ = dz + rand(-6, 6);
      dino.userData.patrol = {
        from: new THREE.Vector3(dx, dy, dz),
        to: new THREE.Vector3(toX, heightAt(toX, toZ), toZ),
        metersPerSec: 0.6,
        dir: 1,
      };
    }
  }

  return {
    update(delta) {
      mixers.forEach(({ mixer, speed }) => mixer.update(delta * (speed || 1)));
      group.children.forEach((root) => {
        const p = root.userData?.patrol;
        if (!p) return;
        const target = p.dir > 0 ? p.to : p.from;
        const pos = root.position;
        const step = p.metersPerSec * delta;
        const vec = new THREE.Vector3().subVectors(target, pos);
        const dist = vec.length();
        if (dist < step) {
          p.dir *= -1;
          root.rotation.y += Math.PI;
        } else {
          vec.normalize().multiplyScalar(step);
          root.position.add(vec);
        }
      });
    },
    dispose() {
      mixers.splice(0, mixers.length);
      scene.remove(group);
    },
  };
}
