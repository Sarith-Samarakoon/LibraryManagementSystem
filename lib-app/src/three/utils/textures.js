import * as THREE from "three";

export function makeTextureLoaders(renderer) {
  const tLoader = new THREE.TextureLoader();
  const ANISO = renderer.capabilities.getMaxAnisotropy();

  const loadSRGB = (url) => {
    const t = tLoader.load(url);
    if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace;
    else t.encoding = THREE.sRGBEncoding;
    t.anisotropy = ANISO;
    return t;
  };

  const loadLinear = (url) => {
    const t = tLoader.load(url);
    t.anisotropy = ANISO;
    return t;
  };

  return { loadSRGB, loadLinear, ANISO };
}
