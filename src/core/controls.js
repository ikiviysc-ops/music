import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const CONFIG = {
  enableDamping: true,
  dampingFactor: 0.05,
  rotateSpeed: 0.5,
  mobileRotateSpeed: 0.8,
  zoomSpeed: 1.2,
  mobileZoomSpeed: 0.8,
  minDistance: 6,
  maxDistance: 30,
  enablePan: true,
  mobileEnablePan: false,
  autoRotate: false,
  autoRotateSpeed: 0.3
};

export function createControls(camera, renderer) {
  const isMobile = window.innerWidth <= 480;
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = CONFIG.enableDamping;
  controls.dampingFactor = CONFIG.dampingFactor;
  controls.rotateSpeed = isMobile ? CONFIG.mobileRotateSpeed : CONFIG.rotateSpeed;
  controls.zoomSpeed = isMobile ? CONFIG.mobileZoomSpeed : CONFIG.zoomSpeed;
  controls.minDistance = CONFIG.minDistance;
  controls.maxDistance = CONFIG.maxDistance;
  controls.enablePan = isMobile ? CONFIG.mobileEnablePan : CONFIG.enablePan;
  controls.autoRotate = CONFIG.autoRotate;
  controls.autoRotateSpeed = CONFIG.autoRotateSpeed;

  return controls;
}
