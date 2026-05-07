import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.3;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.target.set(0, 0, 0);
  controls.minDistance = 4;
  controls.maxDistance = 15;
  controls.update();

  return controls;
}
