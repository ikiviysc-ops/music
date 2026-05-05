import * as THREE from 'three';

const CONFIG = {
  antialias: true,
  mobilePixelRatio: 1.5,
  desktopPixelRatio: 2,
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.0
};

export function createRenderer(container) {
  const isMobile = window.innerWidth <= 480;
  const pixelRatio = isMobile
    ? Math.min(window.devicePixelRatio, CONFIG.mobilePixelRatio)
    : Math.min(window.devicePixelRatio, CONFIG.desktopPixelRatio);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile && CONFIG.antialias,
    alpha: false,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
  });

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = CONFIG.toneMapping;
  renderer.toneMappingExposure = CONFIG.toneMappingExposure;
  renderer.shadowMap.enabled = false;

  container.appendChild(renderer.domElement);

  return renderer;
}

export function updateRendererSize(renderer, container) {
  renderer.setSize(container.clientWidth, container.clientHeight);
}
