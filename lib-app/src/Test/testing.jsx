import { useRef, useEffect } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";

import grass from "./assets/grasslight-big.jpg";
import dirt from "./assets/dirt.jpg";
import stone from "./assets/stone.jpg";

export default function App() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    while (mount.firstChild) mount.removeChild(mount.firstChild);

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // sky blue
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Controls
    const controls = new PointerLockControls(camera, renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 50, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);

    // Textures
    const loader = new THREE.TextureLoader();
    const grassTex = loader.load(grass);
    const dirtTex = loader.load(dirt);
    const stoneTex = loader.load(stone);
    const textures = { grass: grassTex, dirt: dirtTex, stone: stoneTex };

    Object.values(textures).forEach((t) => {
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1, 1);
    });

    // Cube geometry
    const cubeSize = 1;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

    // Generate terrain
    const world = [];
    const terrainSize = 30;
    const noise = new ImprovedNoise();
    const scale = 0.1;

    for (let x = -terrainSize / 2; x < terrainSize / 2; x++) {
      for (let z = -terrainSize / 2; z < terrainSize / 2; z++) {
        const height = Math.floor(
          (noise.noise(x * scale, 0, z * scale) + 1) * 5
        );
        for (let y = 0; y <= height; y++) {
          const mat =
            y === height
              ? new THREE.MeshStandardMaterial({ map: textures.grass })
              : y > height - 3
              ? new THREE.MeshStandardMaterial({ map: textures.dirt })
              : new THREE.MeshStandardMaterial({ map: textures.stone });

          mat.roughness = 0.9;
          mat.metalness = 0;
          mat.side = THREE.FrontSide;

          const cube = new THREE.Mesh(cubeGeo, mat);
          cube.position.set(x * cubeSize, y * cubeSize, z * cubeSize);
          cube.castShadow = true;
          cube.receiveShadow = true;
          scene.add(cube);
          world.push(cube);
        }
      }
    }

    // Load NPCs
    const gltfLoader = new GLTFLoader();
    const npcs = [];
    const npcPositions = [
      { x: 5, z: 5 },
      { x: -5, z: -5 },
      { x: 8, z: -8 },
    ];

    npcPositions.forEach((pos) => {
      gltfLoader.load(
        "https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(0.02, 0.02, 0.02);
          model.position.set(pos.x, 1, pos.z);
          model.traverse((c) => {
            if (c.isMesh) c.castShadow = true;
          });
          scene.add(model);
          const mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
          npcs.push({
            model,
            mixer,
            speed: 1 + Math.random() * 1.5,
            direction: new THREE.Vector3(Math.random(), 0, Math.random()),
          });
        }
      );
    });

    // Movement (Fly Mode)
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const move = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
    };
    const speed = 15;

    const onKeyDown = (e) => {
      switch (e.code) {
        case "KeyW":
          move.forward = true;
          break;
        case "KeyS":
          move.backward = true;
          break;
        case "KeyA":
          move.left = true;
          break;
        case "KeyD":
          move.right = true;
          break;
        case "Space":
          move.up = true;
          break;
        case "ShiftLeft":
          move.down = true;
          break;
      }
    };
    const onKeyUp = (e) => {
      switch (e.code) {
        case "KeyW":
          move.forward = false;
          break;
        case "KeyS":
          move.backward = false;
          break;
        case "KeyA":
          move.left = false;
          break;
        case "KeyD":
          move.right = false;
          break;
        case "Space":
          move.up = false;
          break;
        case "ShiftLeft":
          move.down = false;
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    mount.addEventListener("click", () => controls.lock());

    const clock = new THREE.Clock();

    // Animate
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // NPCs update
      npcs.forEach((npc) => {
        npc.mixer.update(delta);
        npc.model.position.add(
          npc.direction.clone().multiplyScalar(npc.speed * delta)
        );
        if (
          npc.model.position.x > terrainSize / 2 ||
          npc.model.position.x < -terrainSize / 2
        )
          npc.direction.x *= -1;
        if (
          npc.model.position.z > terrainSize / 2 ||
          npc.model.position.z < -terrainSize / 2
        )
          npc.direction.z *= -1;
      });

      // Fly movement
      velocity.set(0, 0, 0);
      direction.z = Number(move.forward) - Number(move.backward);
      direction.x = Number(move.right) - Number(move.left);
      direction.y = Number(move.up) - Number(move.down);
      direction.normalize();
      velocity.copy(direction).multiplyScalar(speed * delta);
      controls.moveRight(velocity.x);
      controls.moveForward(velocity.z);
      camera.position.y += velocity.y;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      cubeGeo.dispose();
    };
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 text-white font-bold text-lg z-10">
        Click to Start 🎮 (WASD = Move, Space = Up, Shift = Down)
      </div>
    </div>
  );
}
