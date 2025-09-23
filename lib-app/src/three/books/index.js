// src/three/books/index.js
import * as THREE from "three";
import BOOKSHELF from "../../assets/models/victorian_bookshelf.glb";

/**
 * Adds a bookshelf GLB and fills it with books.
 * Uses Slot_* empties if present, otherwise builds procedural slots on boards.
 * Shelf materials are preserved from the GLB.
 */
export async function addBookshelfAndBooks({
  scene,
  room,
  renderer,
  gltfLoader,
  books,
}) {
  const ANISO = renderer.capabilities.getMaxAnisotropy();

  // texture helpers
  const tLoader = new THREE.TextureLoader();
  tLoader.setCrossOrigin("anonymous");
  const loadSRGB = (url) => {
    const t = tLoader.load(url);
    if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace;
    else t.encoding = THREE.sRGBEncoding;
    t.anisotropy = ANISO;
    return t;
  };

  // load shelf with original materials
  const gltf = await new Promise((resolve, reject) => {
    gltfLoader.load(BOOKSHELF, resolve, undefined, reject);
  });

  const shelfRoot = gltf.scene;

  // keep original materials, just correct colorspace and enable shadows
  shelfRoot.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    if (m) {
      const mats = Array.isArray(m) ? m : [m];
      mats.forEach((mat) => {
        if (mat && mat.map && "colorSpace" in mat.map) {
          mat.map.colorSpace = THREE.SRGBColorSpace;
        }
        mat.needsUpdate = true;
      });
    }
    o.castShadow = true;
    o.receiveShadow = true;
  });

  // place at the right side of the room, facing inward
  const SHELF_POS = new THREE.Vector3(13.2, 0, -14.0);
  const SHELF_ROT_Y = -Math.PI / 2; // rotate to face the room
  shelfRoot.position.copy(SHELF_POS);
  shelfRoot.rotation.y = SHELF_ROT_Y;
  shelfRoot.scale.set(1, 1, 1);
  room.add(shelfRoot);

  // collect named slots if present
  const namedSlots = [];
  shelfRoot.traverse((o) => {
    if (o.isObject3D && typeof o.name === "string" && /^Slot_/i.test(o.name)) {
      namedSlots.push(o);
    }
  });
  namedSlots.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  // if none, build procedural slots from boards
  const autoSlots =
    namedSlots.length > 0
      ? []
      : buildProceduralSlotsFromBoards(shelfRoot, books.length);

  const slots = namedSlots.length ? namedSlots : autoSlots;

  // fallback row if we still run out
  const fallbackGroup = new THREE.Group();
  scene.add(fallbackGroup);

  // cover cache
  const coverCache = new Map();
  const getCover = (url) => {
    if (!url) return null;
    if (coverCache.has(url)) return coverCache.get(url);
    const tex = loadSRGB(url);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    coverCache.set(url, tex);
    return tex;
  };

  // book factory (material order: +X, -X, +Y, -Y, +Z, -Z; cover on +Z)
  const makeBook = (b, tintHex = 0x4f46e5) => {
    const w = b.size?.width ?? 0.15;
    const h = b.size?.height ?? 0.23;
    const t = b.size?.thick ?? 0.032;

    const geo = new THREE.BoxGeometry(w, h, t);

    const spineMat = new THREE.MeshStandardMaterial({
      color: tintHex,
      roughness: 0.7,
      metalness: 0,
    });
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f4,
      roughness: 1,
    });
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      roughness: 0.85,
    });
    const coverMap = getCover(b.coverUrl);
    const coverMat = coverMap
      ? new THREE.MeshBasicMaterial({ map: coverMap })
      : new THREE.MeshStandardMaterial({ color: tintHex, roughness: 0.7 });

    const mats = [spineMat, backMat, paperMat, paperMat, coverMat, backMat];

    const mesh = new THREE.Mesh(geo, mats);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData = { bookId: b.id, originalMaterials: mats };
    if (typeof b.yaw === "number") mesh.rotation.y = b.yaw;
    return mesh;
  };

  // place books
  const taken = new Set();
  books.forEach((b, idx) => {
    const tint = 0x3b82f6 + (idx % 5) * 0x001111;
    const book = makeBook(b, tint);

    let target = null;
    if (b.slot) {
      const s = shelfRoot.getObjectByName(b.slot);
      if (s && (namedSlots.includes(s) || slots.includes(s)) && !taken.has(s)) {
        target = s;
      }
    }
    if (!target && slots.length) {
      target = slots.find((s) => !taken.has(s));
    }

    if (target) {
      taken.add(target);
      book.position.set(0, 0, 0);
      book.position.z += b.zOffset ?? 0.0;

      if (target.userData?.depthClearance) {
        const tHalf = (b.size?.thick ?? 0.032) * 0.5;
        const maxHalf = target.userData.depthClearance * 0.5;
        if (tHalf > maxHalf) {
          const s = (maxHalf * 2) / (tHalf * 2);
          book.scale.z = Math.min(1, s);
        }
      }

      target.add(book);
    } else {
      // tidy fallback row near the demo shelf if we exhaust slots
      const baseX = 6.9;
      const stepX = 0.22;
      const maxPerRow = 12;
      const row = Math.floor(idx / maxPerRow);
      const col = idx % maxPerRow;
      book.position.set(baseX + col * stepX, 1.25 + row * 0.26, -3.55);
      fallbackGroup.add(book);
    }
  });

  return {
    dispose() {
      fallbackGroup.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose?.();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m?.dispose?.());
        }
      });
      scene.remove(fallbackGroup);
    },
  };
}

/**
 * Infer shelf boards and create "virtual" slots along them.
 * Slots are Object3D children in shelf local space, with +Z pointing outward.
 */
function buildProceduralSlotsFromBoards(shelfRoot, wantCount) {
  const slots = [];
  shelfRoot.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(shelfRoot.matrixWorld).invert();

  // find likely boards: wide in X, thin in Y, with some depth
  const boards = [];
  shelfRoot.traverse((o) => {
    if (!(o.isMesh && o.geometry)) return;
    const worldBB = new THREE.Box3().setFromObject(o);
    const min = worldBB.min.clone().applyMatrix4(inv);
    const max = worldBB.max.clone().applyMatrix4(inv);
    const size = new THREE.Vector3().subVectors(max, min);

    const isBoard =
      size.x > 1.0 && size.y > 0.01 && size.y < 0.15 && size.z > 0.15;
    if (isBoard) boards.push({ min, max, size });
  });

  boards.sort((a, b) => a.max.y - b.max.y);

  const defaultBookW = 0.16;
  const marginX = 0.07;
  const insetZ = 0.03;
  const gapX = 0.02;

  for (const [rowIdx, b] of boards.entries()) {
    if (slots.length >= wantCount) break;

    const xMin = b.min.x + marginX;
    const xMax = b.max.x - marginX;
    const shelfDepth = b.size.z;

    const slotPitch = defaultBookW + gapX;
    const across = Math.max(1, Math.floor((xMax - xMin) / slotPitch));

    const y = b.max.y;
    const zFront = b.max.z;
    const z = zFront - insetZ;

    const depthClearance = Math.max(0.04, shelfDepth - insetZ * 2);

    for (let i = 0; i < across && slots.length < wantCount; i++) {
      const x = xMin + (i + 0.5) * slotPitch;
      const slot = new THREE.Object3D();
      slot.name = `AutoSlot_${rowIdx + 1}_${i + 1}`;
      slot.position.set(x, y, z);
      slot.rotation.set(0, 0, 0);
      slot.userData.depthClearance = depthClearance;

      shelfRoot.add(slot);
      slots.push(slot);
    }
  }

  return slots;
}
