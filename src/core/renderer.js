import * as THREE from 'three';

const CONFIG = {
  antialias: true,
  pixelRatio: 2
};

export function createRenderer(container) {
  console.log('[Renderer] Starting to create WebGLRenderer...');
  
  // 检查 WebGL 支持
  const canvasTest = document.createElement('canvas');
  let gl = null;
  try {
    gl = canvasTest.getContext('webgl') || canvasTest.getContext('experimental-webgl');
  } catch (e) {
    console.error('[Renderer] WebGL not supported:', e);
  }
  
  if (!gl) {
    console.error('[Renderer] WebGL is NOT available in this browser!');
    const warning = document.createElement('div');
    warning.style.position = 'fixed';
    warning.style.top = '50%';
    warning.style.left = '50%';
    warning.style.transform = 'translate(-50%, -50%)';
    warning.style.color = 'white';
    warning.style.background = 'rgba(0,0,0,0.9)';
    warning.style.padding = '20px';
    warning.style.borderRadius = '8px';
    warning.style.zIndex = '9999';
    warning.innerHTML = '<h3>WebGL 不可用</h3><p>请使用支持 WebGL 的现代浏览器</p>';
    document.body.appendChild(warning);
    throw new Error('WebGL not supported');
  }
  
  console.log('[Renderer] WebGL is available, creating renderer...');
  
  const pixelRatio = Math.min(window.devicePixelRatio, CONFIG.pixelRatio);

  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: CONFIG.antialias,
      alpha: true,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false
    });
  } catch (e) {
    console.error('[Renderer] Failed to create WebGLRenderer, trying without antialias:', e);
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'default'
    });
  }

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);
  
  console.log('[Renderer] Renderer created successfully!');
  console.log('[Renderer] Renderer domElement:', renderer.domElement);

  return renderer;
}

export function updateRendererSize(renderer, container) {
  const pixelRatio = Math.min(window.devicePixelRatio, CONFIG.pixelRatio);
  
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(pixelRatio);
}
