import * as THREE from 'three';

const CONFIG = {
  fov: 45,
  near: 0.1,
  far: 1000,
  position: { x: 0, y: 0.2, z: 4.5 },
  mobilePosition: { x: 0, y: 0.15, z: 4.8 }
};

export function createCamera(container) {
  const isMobile = window.innerWidth <= 480;
  const aspect = container.clientWidth / container.clientHeight;
  const pos = isMobile ? CONFIG.mobilePosition : CONFIG.position;

  const camera = new THREE.PerspectiveCamera(CONFIG.fov, aspect, CONFIG.near, CONFIG.far);
  camera.position.set(pos.x, pos.y, pos.z);
  camera.lookAt(0, 0, 0);

  return camera;
}

export function updateCameraAspect(camera, container) {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
}
