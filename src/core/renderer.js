import * as THREE from 'three';

const CONFIG = {
  antialias: true,
  pixelRatio: 2
};

export function createRenderer(container) {
  const pixelRatio = Math.min(window.devicePixelRatio, CONFIG.pixelRatio);

  const renderer = new THREE.WebGLRenderer({
    antialias: CONFIG.antialias,
    alpha: false,
    powerPreference: 'high-performance'
  });

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = false;

  container.appendChild(renderer.domElement);

  return renderer;
}

export function updateRendererSize(renderer, container) {
  const pixelRatio = Math.min(window.devicePixelRatio, CONFIG.pixelRatio);
  
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(pixelRatio);
}
