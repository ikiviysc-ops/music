import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const CONFIG = {
  enableDamping: true,
  dampingFactor: 0.05,
  rotateSpeed: 0.3,
  mobileRotateSpeed: 0.4,
  zoomSpeed: 0,
  mobileZoomSpeed: 0,
  minDistance: 0,
  maxDistance: Infinity,
  enablePan: false,
  mobileEnablePan: false,
  autoRotate: false,
  autoRotateSpeed: 0,
  enableZoom: false,
  enableRotate: true
};

export function createControls(camera, renderer) {
  const isMobile = window.innerWidth <= 480;
  const controls = new OrbitControls(camera, renderer.domElement);

  // 基本控制设置
  controls.enableDamping = CONFIG.enableDamping;
  controls.dampingFactor = CONFIG.dampingFactor;
  controls.rotateSpeed = isMobile ? CONFIG.mobileRotateSpeed : CONFIG.rotateSpeed;
  controls.zoomSpeed = 0;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = false;
  
  // 固定相机位置和角度
  controls.minDistance = camera.position.length();
  controls.maxDistance = camera.position.length();
  
  // 设置目标为地球中心
  controls.target.set(0, 0, 0);
  
  // 更新一次确保目标生效
  controls.update();

  return controls;
}
