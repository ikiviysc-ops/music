import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.3;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.target.set(0, 0, 0);
  controls.minDistance = camera.position.length();
  controls.maxDistance = camera.position.length();
  controls.update();

  return controls;
}
