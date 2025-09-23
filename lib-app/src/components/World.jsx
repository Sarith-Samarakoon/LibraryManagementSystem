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

// NEW: import the statue helper
import { addHCAStatue } from "../three/props/hcaStatue.js";

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
    else renderer.outputEncoding = THREE.SRGBEncoding;

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

    // declarations for cleanup
    const gltfLoader = makeGLTFLoader(renderer);
    let disposeBooks = null;
    let characters = { update: () => {}, dispose: () => {} };
    let disposeStatue = null; // NEW
    const tooltipEl = document.getElementById("book-tooltip");
    let bookUI = { update: () => {}, click: () => {} };

    // async init
    let cancelled = false;
    (async () => {
      try {
        const booksRes = await addBookshelfAndBooks({
          scene,
          room,
          renderer,
          gltfLoader,
          books,
        });
        if (cancelled) return;
        disposeBooks = booksRes?.dispose ?? null;

        // NEW: add the H.C. Andersen statue in front of the room
        // In src/components/World.jsx inside the async init block
        const statueRes = await addHCAStatue(scene, gltfLoader, heightAt, {
          x: 7.5,
          z: 7.2,
          rotationY: MathUtils.degToRad(350),
          // make the figure itself smaller
          targetHeight: 3.6, // try 0.5 if you want tiny
          // keep the pedestal in scale with the figure
          pedestal: { w: 0.38, h: 0.14, d: 0.38 },
        });

        if (cancelled) return;
        disposeStatue = statueRes?.dispose ?? null;

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

      // camera move
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

      // updates
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
        disposeBooks?.();
      } catch {}
      try {
        disposeStatue?.();
      } catch {}
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
