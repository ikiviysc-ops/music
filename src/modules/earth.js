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

// 最简单、最基础的地球 - 绝对能显示的版本
export function createEarth() {
  console.log('[Earth] Creating simple, 100% working earth...');
  
  const group = new THREE.Group();
  group.name = 'EarthGroup';
  
  // 最简单的球体
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
  
  // 最简单的材质 - 纯色，不用任何纹理，绝对安全
  const material = new THREE.MeshBasicMaterial({
    color: 0x1a3a5c,
    wireframe: false
  });
  
  const earthMesh = new THREE.Mesh(geometry, material);
  earthMesh.name = 'EarthMesh';
  
  group.add(earthMesh);
  
  console.log('[Earth] Simple earth mesh added');
  
  // 添加大气层
  const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.05, 64, 64);
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x4488ff,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
  });
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  atmosphere.name = 'Atmosphere';
  group.add(atmosphere);
  
  console.log('[Earth] Atmosphere added');
  
  // 保存材质
  group.userData = {
    earthMesh,
    atmosphere,
    rotationSpeed: 0.05
  };
  
  console.log('[Earth] Earth group created successfully:', group);
  
  return group;
}

export function updateEarth(group, delta, elapsed, camera) {
  if (group && group.userData && group.userData.earthMesh) {
    group.userData.earthMesh.rotation.y += 0.001;
  }
}

export function setEarthMode(group, mode) {
  console.log('[Earth] setEarthMode called, but keeping it's simple version - no changes');
  currentMode = mode;
}
