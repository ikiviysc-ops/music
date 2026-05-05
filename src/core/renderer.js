import * as THREE from 'three';

const CONFIG = {
  antialias: true,
  mobilePixelRatio: 2,
  desktopPixelRatio: 3
};

export function createRenderer(container) {
  const isMobile = window.innerWidth <= 480;
  const pixelRatio = isMobile
    ? Math.min(window.devicePixelRatio, CONFIG.mobilePixelRatio)
    : Math.min(window.devicePixelRatio, CONFIG.desktopPixelRatio);

  const renderer = new THREE.WebGLRenderer({
    antialias: CONFIG.antialias,
    alpha: false,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
  });

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = false;

  container.appendChild(renderer.domElement);

  return renderer;
}

export function updateRendererSize(renderer, container) {
  renderer.setSize(container.clientWidth, container.clientHeight);
}
