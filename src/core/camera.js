import * as THREE from 'three';

const CONFIG = {
  fov: 50,
  near: 0.1,
  far: 1000,
  mobileFov: 60,
  // 相机位置让地球在上半部分
  position: { x: 0, y: 1.2, z: 10 },
  mobilePosition: { x: 0, y: 1.0, z: 9 }
};

export function createCamera(container) {
  const isMobile = window.innerWidth <= 480;
  const aspect = container.clientWidth / container.clientHeight;
  const fov = isMobile ? CONFIG.mobileFov : CONFIG.fov;
  const pos = isMobile ? CONFIG.mobilePosition : CONFIG.position;

  const camera = new THREE.PerspectiveCamera(fov, aspect, CONFIG.near, CONFIG.far);
  camera.position.set(pos.x, pos.y, pos.z);
  // 让相机稍微向上看，让地球位置更合适
  camera.lookAt(0, 0.2, 0);

  return camera;
}

export function updateCameraAspect(camera, container) {
  const isMobile = window.innerWidth <= 480;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.fov = isMobile ? CONFIG.mobileFov : CONFIG.fov;
  const pos = isMobile ? CONFIG.mobilePosition : CONFIG.position;
  camera.position.set(pos.x, pos.y, pos.z);
  camera.lookAt(0, 0.2, 0);
  camera.updateProjectionMatrix();
}
