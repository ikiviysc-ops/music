import * as THREE from 'three';

const CONFIG = {
  fov: 40,
  near: 0.1,
  far: 1000,
  mobileFov: 45,
  // 相机位置让地球完整显示在屏幕中央
  position: { x: 0, y: 0.5, z: 14 },
  mobilePosition: { x: 0, y: 0.3, z: 15 }
};

export function createCamera(container) {
  const isMobile = window.innerWidth <= 480;
  const aspect = container.clientWidth / container.clientHeight;
  const fov = isMobile ? CONFIG.mobileFov : CONFIG.fov;
  const pos = isMobile ? CONFIG.mobilePosition : CONFIG.position;

  const camera = new THREE.PerspectiveCamera(fov, aspect, CONFIG.near, CONFIG.far);
  camera.position.set(pos.x, pos.y, pos.z);
  // 让相机看向地球中心
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
