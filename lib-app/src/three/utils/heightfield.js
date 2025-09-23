import * as THREE from "three";

export function makeHeightSampler(ground, hills = null) {
  const downcaster = new THREE.Raycaster();
  const downDir = new THREE.Vector3(0, -1, 0);

  return function heightAt(x, z) {
    const origin = new THREE.Vector3(x, 140, z);
    downcaster.set(origin, downDir);
    const targets = [ground];
    if (hills) targets.push(...hills.children);
    const hits = downcaster.intersectObjects(targets, false);
    return hits.length ? hits[0].point.y : 0;
  };
}
