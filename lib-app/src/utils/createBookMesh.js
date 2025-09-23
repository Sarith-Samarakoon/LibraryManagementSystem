import * as THREE from "three";

export function createBookMesh({
  width = 0.16, // X
  height = 0.24, // Y
  thick = 0.035, // Z
  coverTexture, // THREE.Texture (front)
  available = true,
}) {
  const geo = new THREE.BoxGeometry(width, height, thick);

  if (coverTexture) {
    coverTexture.anisotropy = 8; // fixed value; no renderer creation
    coverTexture.colorSpace = THREE.SRGBColorSpace;
    coverTexture.generateMipmaps = true;
    coverTexture.wrapS = THREE.ClampToEdgeWrapping;
    coverTexture.wrapT = THREE.ClampToEdgeWrapping;
  }

  const paperColor = new THREE.Color(0xf5f5f4);
  const backColor = new THREE.Color(0xe5e7eb);
  const spineColor = available
    ? new THREE.Color(0x3b82f6)
    : new THREE.Color(0x9ca3af);

  const sideMat = new THREE.MeshStandardMaterial({
    color: paperColor,
    roughness: 0.9,
    metalness: 0,
  });
  const spineMat = new THREE.MeshStandardMaterial({
    color: spineColor,
    roughness: 0.6,
    metalness: 0,
  });
  const topMat = new THREE.MeshStandardMaterial({
    color: paperColor,
    roughness: 0.9,
    metalness: 0,
  });
  const bottomMat = new THREE.MeshStandardMaterial({
    color: paperColor,
    roughness: 0.9,
    metalness: 0,
  });
  const coverMat = new THREE.MeshStandardMaterial({
    map: coverTexture,
    roughness: 0.6,
    metalness: 0,
  });
  const backMat = new THREE.MeshStandardMaterial({
    color: backColor,
    roughness: 0.9,
    metalness: 0,
  });

  // Order: +x, -x, +y, -y, +z, -z
  const materials = [sideMat, spineMat, topMat, bottomMat, coverMat, backMat];

  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
