// src/three/interaction/booksRaycast.js
import * as THREE from "three";

/**
 * Creates raycast-based hover and click for books.
 * Hover tints only non-cover faces; the cover stays visible.
 * Click calls selectById(bookId).
 */
export function makeBookRaycast(scene, books, selectById, tooltipEl) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(0, 0); // center for pointer-lock FPS
  let highlighted = null;

  // Shared hover color used on non-cover faces
  const hoverTint = new THREE.Color(0xf59e0b);

  function restoreMaterials(mesh) {
    const orig = mesh.userData?.originalMaterials;
    if (orig) mesh.material = orig;
  }

  function makeHoverMaterials(mesh) {
    const orig = mesh.userData?.originalMaterials;
    const coverIndex = mesh.userData?.coverFaceIndex ?? 4; // default +Z
    if (!Array.isArray(orig)) return mesh.material;

    // Clone materials and tint non-cover faces; keep the cover as-is
    return orig.map((m, i) => {
      if (i === coverIndex) return m; // keep cover face untouched
      const clone =
        m?.isMaterial && m.clone ? m.clone() : new THREE.MeshStandardMaterial();
      if (clone.color) clone.color = hoverTint.clone();
      if ("roughness" in clone) clone.roughness = 0.5;
      return clone;
    });
  }

  function findBookMeshes() {
    const arr = [];
    scene.traverse((o) => {
      if (o.isMesh && o.userData?.bookId) arr.push(o);
    });
    return arr;
  }

  function update(camera) {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(findBookMeshes(), false);

    if (hits.length > 0) {
      const hit = hits[0].object;
      if (highlighted && highlighted !== hit) {
        restoreMaterials(highlighted);
      }
      highlighted = hit;
      hit.material = makeHoverMaterials(hit);

      if (tooltipEl) {
        const book = books.find((x) => x.id === hit.userData.bookId);
        tooltipEl.textContent = book
          ? `${book.title} — ${book.author}`
          : "Book";
        tooltipEl.style.opacity = "1";
      }
    } else {
      if (highlighted) {
        restoreMaterials(highlighted);
        highlighted = null;
      }
      if (tooltipEl) tooltipEl.style.opacity = "0";
    }
  }

  function click(camera, controls) {
    if (!controls?.isLocked) return;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(findBookMeshes(), false);
    if (hits.length) {
      const id = hits[0].object.userData.bookId;
      if (id) selectById(id);
    }
  }

  return { update, click };
}
