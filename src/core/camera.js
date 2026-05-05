import * as THREE from 'three';

const CONFIG = {
  fov: 35,
  near: 0.1,
  far: 1000,
  mobileFov: 40,
  position: { x: 0, y: 0.2, z: 5.5 },
  mobilePosition: { x: 0, y: 0.15, z: 6.0 }
};

export function createCamera(container) {
  const isMobile = window.innerWidth <= 480;
  const aspect = container.clientWidth / container.clientHeight;
  const fov = isMobile ? CONFIG.mobileFov : CONFIG.fov;
  const pos = isMobile ? CONFIG.mobilePosition : CONFIG.position;

  const camera = new THREE.PerspectiveCamera(fov, aspect, CONFIG.near, CONFIG.far);
  camera.position.set(pos.x, pos.y, pos.z);
  camera.lookAt(0, 0, 0);

  return camera;
}

export function updateCameraAspect(camera, container) {
  const isMobile = window.innerWidth <= 480;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.fov = isMobile ? CONFIG.mobileFov : CONFIG.fov;
  const pos = isMobile ? CONFIG.mobilePosition : CONFIG.position;
  camera.position.set(pos.x, pos.y, pos.z);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}
