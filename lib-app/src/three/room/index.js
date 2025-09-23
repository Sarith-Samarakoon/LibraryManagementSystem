import * as THREE from "three";

export function buildRoom(scene) {
  const room = new THREE.Group();

  // carpet
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 20),
    new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 1 })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(7.5, 0.01, -5);
  carpet.receiveShadow = true;
  room.add(carpet);

  // walls
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf4f4f5,
    roughness: 1,
  });
  const wall1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 20), wallMat);
  wall1.position.set(-0.5, 2, -5);
  const wall2 = new THREE.Mesh(new THREE.BoxGeometry(30, 4, 0.5), wallMat);
  wall2.position.set(7.5, 2, -15);
  const wall3 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 20), wallMat);
  wall3.position.set(15.5, 2, -5);
  [wall1, wall2, wall3].forEach((w) => (w.castShadow = w.receiveShadow = true));
  room.add(wall1, wall2, wall3);

  // sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(4, 1, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x222831 })
  );
  sign.position.set(7.5, 3.2, -14.5);
  sign.castShadow = true;
  room.add(sign);

  const makeLetter = (x) => {
    const m = new THREE.MeshStandardMaterial({
      color: 0xffe082,
      emissive: 0x332200,
      emissiveIntensity: 0.7,
    });
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.1), m);
    b.position.set(x, 3.2, -14.45);
    return b;
  };
  for (let i = -1.2; i <= 1.2; i += 0.4) room.add(makeLetter(7.5 + i));

  // fallback shelf
  const shelf = new THREE.Group();
  const shelfMat = new THREE.MeshStandardMaterial({
    color: 0x8b6f47,
    roughness: 0.85,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(6, 2.2, 0.5), shelfMat);
  body.position.set(7.5, 1.2, -3.2);
  body.castShadow = body.receiveShadow = true;
  shelf.add(body);
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0x6b4f2a,
    roughness: 1,
  });
  const board1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.08, 0.8), boardMat);
  board1.position.set(7.5, 1.2, -3.6);
  const board2 = board1.clone();
  board2.position.y = 0.7;
  shelf.add(board1, board2);
  room.add(shelf);

  scene.add(room);
  return room;
}
