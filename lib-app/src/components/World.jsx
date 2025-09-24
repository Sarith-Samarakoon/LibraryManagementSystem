// src/components/World.jsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { MathUtils } from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

import useLibraryStore from "../store/libraryStore.js";
import { disposeHierarchy } from "../utils/threeDisposer.js";

import { createEnvironment } from "../three/environment/index.js";
import { buildRoom } from "../three/room/index.js";
import { addBookshelfAndBooks } from "../three/books/index.js";
import { makeGLTFLoader } from "../three/loaders/gltf.js";
import { makeHeightSampler } from "../three/utils/heightfield.js";
import { makeBookRaycast } from "../three/interaction/booksRaycast.js";
import { initCharacters } from "../three/characters/index.js";
import { addHCAStatue } from "../three/props/hcaStatue.js";

import LIBRARY from "../assets/models/amethyst_library_diorama.glb";
import ROOF from "../assets/models/roof_baked.glb";
import FISHTANK from "../assets/models/room_aquarium_now_animated.glb";
import CAR from "../assets/models/free_porsche_911_carrera_4s.glb";
import DESK from "../assets/models/low_poly_man.glb";

// Two different bookshelf GLBs
import SHELF_RIGHT from "../assets/models/victorian_bookshelf.glb";
import SHELF_LEFT from "../assets/models/bookshelf (1).glb";
import SHELF from "../assets/models/bookshelf (2).glb";
import SMALL_SHELF from "../assets/models/3d_wall_bookshelf_-_lowpoly.glb";

export default function World() {
  const mountRef = useRef(null);
  const selectById = useLibraryStore((s) => s.selectById);
  const books = useLibraryStore((s) => s.books);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    while (mount.firstChild) mount.removeChild(mount.firstChild);

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // scene, camera, renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1500);
    camera.position.set(0, 2, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    if ("outputColorSpace" in renderer)
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    else renderer.outputEncoding = THREE.sRGBEncoding;

    mount.appendChild(renderer.domElement);

    // controls
    const controls = new PointerLockControls(camera, renderer.domElement);

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const hemi = new THREE.HemisphereLight(0xffffff, 0x667788, 0.7);
    hemi.position.set(0, 100, 0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(30, 80, 20);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    Object.assign(dir.shadow.camera, {
      near: 0.1,
      far: 350,
      left: -80,
      right: 80,
      top: 80,
      bottom: -80,
    });
    scene.add(dir);

    // env + terrain
    const { ground, hills } = createEnvironment(scene, renderer);
    const heightAt = makeHeightSampler(ground, hills);

    // room
    const room = buildRoom(scene);

    // loader
    const gltfLoader = makeGLTFLoader(renderer);

    // cleanup refs
    let disposeRightShelf = null;
    let disposeLeftShelf = null;
    let disposeShelf = null;
    let disposeSmallShelf = null;
    let disposeLibrary = null;
    let disposeRoof = null;
    let disposeFishTank = null;
    let disposeCar = null;
    let disposeDesk = null;
    let characters = { update: () => {}, dispose: () => {} };
    let disposeStatue = null;
    const tooltipEl = document.getElementById("book-tooltip");
    let bookUI = { update: () => {}, click: () => {} };

    // Animation mixers
    let fishTankMixer = null;
    let deskMixer = null;

    // async init
    let cancelled = false;
    (async () => {
      try {
        // split books between shelves (adjust as you like)
        const mid = Math.ceil(books.length / 2);
        const rightBooks = books.slice(0, mid);
        const leftBooks = books.slice(mid);

        // RIGHT WALL: Victorian
        const rightRes = await addBookshelfAndBooks({
          scene,
          room,
          renderer,
          gltfLoader,
          books: rightBooks,
          modelUrl: SHELF_RIGHT,
          placement: {
            position: new THREE.Vector3(12.6, 0, -14.0),
            rotationY: -Math.PI / 2,
            scale: 1.5,
          },
        });
        if (cancelled) return;
        disposeRightShelf = rightRes?.dispose ?? null;

        // LEFT WALL: Modern (second, different GLB)
        const leftRes = await addBookshelfAndBooks({
          scene,
          room,
          renderer,
          gltfLoader,
          books: leftBooks,
          modelUrl: SHELF_LEFT,
          placement: {
            position: new THREE.Vector3(0.1, 0, -11.0),
            rotationY: Math.PI / 2,
            scale: 0.02,
          },
          normalizeShelfColorSpace: true,
        });
        if (cancelled) return;
        disposeLeftShelf = leftRes?.dispose ?? null;

        // Additional SHELF closer to right side
        const shelfRes = await addBookshelfAndBooks({
          scene,
          room,
          renderer,
          gltfLoader,
          books: [],
          modelUrl: SHELF,
          placement: {
            position: new THREE.Vector3(7.0, 0.5, -14.0),
            rotationY: -Math.PI / 2,
            scale: 1.0,
          },
          normalizeShelfColorSpace: true,
        });
        if (cancelled) return;
        disposeShelf = shelfRes?.dispose ?? null;

        // SMALL_SHELF even closer to right side
        const smallShelfRes = await addBookshelfAndBooks({
          scene,
          room,
          renderer,
          gltfLoader,
          books: [],
          modelUrl: SMALL_SHELF,
          placement: {
            position: new THREE.Vector3(10.0, -2.42, -14.0),
            rotationY: -Math.PI / 2,
            scale: 0.5,
          },
          normalizeShelfColorSpace: true,
        });
        if (cancelled) return;
        disposeSmallShelf = smallShelfRes?.dispose ?? null;

        // LIBRARY diorama on the right side
        const libraryRes = await new Promise((resolve, reject) => {
          gltfLoader.load(
            LIBRARY,
            (gltf) => {
              const libraryRoot = gltf.scene;
              libraryRoot.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
              libraryRoot.position.set(35.0, 0.0, -10.0);
              libraryRoot.rotation.y = Math.PI / 3;
              libraryRoot.scale.set(2, 2, 2);
              room.add(libraryRoot);
              resolve({ dispose: () => disposeHierarchy(libraryRoot) });
            },
            undefined,
            reject
          );
        });
        if (cancelled) return;
        disposeLibrary = libraryRes?.dispose ?? null;

        // ROOF on top of the library
        const roofRes = await new Promise((resolve, reject) => {
          gltfLoader.load(
            ROOF,
            (gltf) => {
              const roofRoot = gltf.scene;
              roofRoot.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
              roofRoot.position.set(7.5, 5.5, -4);
              roofRoot.rotation.y = 0;
              roofRoot.scale.set(0.056, 0.056, 0.056);
              room.add(roofRoot);
              resolve({ dispose: () => disposeHierarchy(roofRoot) });
            },
            undefined,
            reject
          );
        });
        if (cancelled) return;
        disposeRoof = roofRes?.dispose ?? null;

        // FISHTANK inside the library
        const fishTankRes = await new Promise((resolve, reject) => {
          gltfLoader.load(
            FISHTANK,
            (gltf) => {
              const fishTankRoot = gltf.scene;
              fishTankRoot.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
              fishTankRoot.position.set(14.0, 2.0, -1.0);
              fishTankRoot.rotation.y = -190;
              fishTankRoot.scale.set(0.01, 0.01, 0.01);
              room.add(fishTankRoot);

              fishTankMixer = new THREE.AnimationMixer(fishTankRoot);
              if (gltf.animations && gltf.animations.length > 0) {
                const action = fishTankMixer.clipAction(gltf.animations[0]);
                action.play();
              }

              resolve({
                dispose: () => {
                  if (fishTankMixer) fishTankMixer.stopAll();
                  disposeHierarchy(fishTankRoot);
                },
              });
            },
            undefined,
            reject
          );
        });
        if (cancelled) return;
        disposeFishTank = fishTankRes?.dispose ?? null;

        // CAR on the left side of the library
        const carRes = await new Promise((resolve, reject) => {
          gltfLoader.load(
            CAR,
            (gltf) => {
              const carRoot = gltf.scene;
              carRoot.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
              // Left side of library (negative x relative to library's position)
              carRoot.position.set(-4.0, 1.3, -3.0);
              carRoot.rotation.y = 0; // Match library rotation
              carRoot.scale.set(2, 2, 2); // Adjust scale to fit
              room.add(carRoot);
              resolve({ dispose: () => disposeHierarchy(carRoot) });
            },
            undefined,
            reject
          );
        });
        if (cancelled) return;
        disposeCar = carRes?.dispose ?? null;

        // DESK in front of the library (animated)
        const deskRes = await new Promise((resolve, reject) => {
          gltfLoader.load(
            DESK,
            (gltf) => {
              const deskRoot = gltf.scene;
              deskRoot.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
              // In front of library (positive z relative to library's position, adjusted for rotation)
              deskRoot.position.set(7.0, 0.0, 0);
              deskRoot.rotation.y = 0; // Match library rotation
              deskRoot.scale.set(0.3, 0.3, 0.3); // Adjust scale to fit
              room.add(deskRoot);

              deskMixer = new THREE.AnimationMixer(deskRoot);
              if (gltf.animations && gltf.animations.length > 0) {
                const action = deskMixer.clipAction(gltf.animations[0]);
                action.play();
              }

              resolve({
                dispose: () => {
                  if (deskMixer) deskMixer.stopAll();
                  disposeHierarchy(deskRoot);
                },
              });
            },
            undefined,
            reject
          );
        });
        if (cancelled) return;
        disposeDesk = deskRes?.dispose ?? null;

        // statue
        const statueRes = await addHCAStatue(scene, gltfLoader, heightAt, {
          x: 7.5,
          z: 10.2,
          rotationY: MathUtils.degToRad(350),
          targetHeight: 3.6,
          pedestal: { w: 0.38, h: 0.14, d: 0.38 },
        });
        if (cancelled) return;
        disposeStatue = statueRes?.dispose ?? null;

        // characters + interaction
        characters = await initCharacters(scene, gltfLoader, heightAt);
        if (cancelled) return;

        bookUI = makeBookRaycast(scene, books, selectById, tooltipEl);
      } catch (e) {
        console.error(e);
      }
    })();

    // movement
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

    const clickHandler = () => bookUI.click(camera, controls);
    renderer.domElement.addEventListener("click", clickHandler);

    // animate
    const clock = new THREE.Clock();
    let animId;
    function animate() {
      const delta = clock.getDelta();

      velocity.set(0, 0, 0);
      direction.z = Number(move.forward) - Number(move.backward);
      direction.x = Number(move.right) - Number(move.left);
      direction.y = Number(move.up) - Number(move.down);
      if (direction.lengthSq() > 0) direction.normalize();
      velocity.copy(direction).multiplyScalar(speed * delta);
      controls.moveRight(velocity.x);
      controls.moveForward(velocity.z);
      camera.position.y = Math.max(
        1.2,
        Math.min(3.5, camera.position.y + velocity.y)
      );

      // Update fish tank and desk animations
      if (fishTankMixer) fishTankMixer.update(delta);
      if (deskMixer) deskMixer.update(delta);

      bookUI.update(camera);
      characters.update(delta);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    }
    animate();

    // resize
    const handleResize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // cleanup
    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("click", clickHandler);
      if (animId) cancelAnimationFrame(animId);
      try {
        characters.dispose?.();
      } catch {}
      try {
        disposeRightShelf?.();
      } catch {}
      try {
        disposeLeftShelf?.();
      } catch {}
      try {
        disposeShelf?.();
      } catch {}
      try {
        disposeSmallShelf?.();
      } catch {}
      try {
        disposeLibrary?.();
      } catch {}
      try {
        disposeRoof?.();
      } catch {}
      try {
        disposeFishTank?.();
      } catch {}
      try {
        disposeCar?.();
      } catch {}
      try {
        disposeDesk?.();
      } catch {}
      try {
        disposeStatue?.();
      } catch {}
      if (fishTankMixer) fishTankMixer.stopAll();
      if (deskMixer) deskMixer.stopAll();
      disposeHierarchy(scene);
      renderer.dispose();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
    };
  }, [books, selectById]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      {/* Crosshair */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 border border-white/85 rounded-sm shadow-[0_0_8px_rgba(0,0,0,0.6)]" />
      </div>
      {/* Hover title */}
      <div
        id="book-tooltip"
        className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md bg-black/70 text-white text-sm opacity-0 transition-opacity"
      />
    </div>
  );
}
