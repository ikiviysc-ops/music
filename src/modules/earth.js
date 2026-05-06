import * as THREE from 'three';

export const EARTH_MODES = {
  STANDARD: 'standard',
  TRANSLUCENT: 'translucent',
  DAYTIME: 'daytime',
  CLOUDS: 'clouds',
  POINTS: 'points',
  CITY_LIGHTS: 'cityLights'
};

let currentMode = EARTH_MODES.CITY_LIGHTS;

export const EARTH_RADIUS = 1.6;

export function getCurrentEarthMode() {
  return currentMode;
}

export function getAvailableEarthModes() {
  return EARTH_MODES;
}

export function createEarth() {
  console.log('🌍 [Earth] Creating simple earth...');
  
  const group = new THREE.Group();
  group.name = 'EarthGroup';
  
  // 创建一个最简单的球体，使用纯色
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
  const material = new THREE.MeshBasicMaterial({
    color: 0x1a3a5c
  });
  const earthMesh = new THREE.Mesh(geometry, material);
  earthMesh.name = 'EarthMesh';
  group.add(earthMesh);
  
  console.log('🌍 [Earth] Simple earth mesh added');
  
  // 添加大气层
  const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.05, 64, 64);
  const atmoMat = new THREE.MeshBasicMaterial({
    color: 0x4488ff,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
  });
  const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
  atmosphere.name = 'Atmosphere';
  group.add(atmosphere);
  
  group.userData = {
    earthMesh,
    atmosphere
  };
  
  console.log('🌍 [Earth] Earth created!');
  return group;
}

export function updateEarth(group, delta, elapsed, camera) {
  if (group && group.userData && group.userData.earthMesh) {
    group.userData.earthMesh.rotation.y += 0.001;
  }
}

export function setEarthMode(group, mode) {
  console.log('[Earth] Mode change not implemented in simple version');
  currentMode = mode;
}
