import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createControls(camera, renderer) {
  if (renderer._isFallback) {
    return createFallbackControls(camera, renderer);
  }

  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.3;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.target.set(0, 0, 0);
  controls.minDistance = 3;
  controls.maxDistance = 10;
  controls.update();

  return controls;
}

function createFallbackControls(camera, renderer) {
  const canvas = renderer.domElement;
  
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let rotationX = 0;
  let rotationY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let targetZoom = camera.position.z;
  
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    velocityX = 0;
    velocityY = 0;
  });
  
  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    velocityX = dx * 0.005;
    velocityY = dy * 0.005;
    rotationY += velocityX;
    rotationX += velocityY;
    rotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotationX));
    lastX = e.clientX;
    lastY = e.clientY;
  });
  
  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
  });
  
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    targetZoom += e.deltaY * 0.005;
    targetZoom = Math.max(3, Math.min(10, targetZoom));
  }, { passive: false });
  
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      velocityX = 0;
      velocityY = 0;
    }
  });
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastX;
    const dy = e.touches[0].clientY - lastY;
    velocityX = dx * 0.005;
    velocityY = dy * 0.005;
    rotationY += velocityX;
    rotationX += velocityY;
    rotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotationX));
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }, { passive: false });
  
  canvas.addEventListener('touchend', () => {
    isDragging = false;
  });
  
  return {
    _isFallback: true,
    _rotationX: () => rotationX,
    _rotationY: () => rotationY,
    
    update() {
      if (!isDragging) {
        velocityX *= 0.95;
        velocityY *= 0.95;
        rotationY += velocityX;
        rotationX += velocityY;
        rotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotationX));
      }
      
      camera.position.z += (targetZoom - camera.position.z) * 0.1;
    },
    
    get target() { return { set: () => {} }; },
    set target(v) {},
    get enableDamping() { return true; },
    set enableDamping(v) {},
    get dampingFactor() { return 0.05; },
    set dampingFactor(v) {}
  };
}
