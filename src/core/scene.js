import * as THREE from 'three';

const CONFIG = {
  bgColor: 0x050510,
  fogNear: 30,
  fogFar: 100
};

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.bgColor);
  scene.fog = new THREE.Fog(CONFIG.bgColor, CONFIG.fogNear, CONFIG.fogFar);
  return scene;
}
