import * as THREE from 'three';

const EARTH_RADIUS = 1.6;
const ROTATION_SPEED = 0.0003;

export const EARTH_MODES = {
  STANDARD: 'standard',
  TRANSLUCENT: 'translucent',
  DAYTIME: 'daytime',
  CLOUDS: 'clouds',
  POINTS: 'points',
  CITY_LIGHTS: 'cityLights'
};

let currentMode = EARTH_MODES.STANDARD;

function createAtmosphere() {
  const count = 20000;
  const radius = EARTH_RADIUS * 1.1;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x4488ff,
    size: 0.04,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  return new THREE.Points(geometry, material);
}

export function createEarth() {
  const loader = new THREE.TextureLoader();
  const nightUrl = 'https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg';
  const dayUrl = 'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg';
  const cloudsUrl = 'https://unpkg.com/three-globe@2.31.0/example/clouds/clouds.png';

  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);

  const nightMaterial = new THREE.MeshBasicMaterial({
    color: 0x111122
  });

  const earth = new THREE.Mesh(geometry, nightMaterial);

  loader.load(nightUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    nightMaterial.map = texture;
    nightMaterial.color.setHex(0xffffff);
    nightMaterial.needsUpdate = true;
    console.log('Night texture loaded');
  }, undefined, () => {
    console.log('Night texture failed, using fallback color');
  });

  const cloudsGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.015, 64, 64);
  const cloudsMaterial = new THREE.MeshBasicMaterial({
    color: 0x4488ff,
    transparent: true,
    opacity: 0.8,
    depthWrite: false
  });
  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
  clouds.visible = false;

  loader.load(cloudsUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    cloudsMaterial.map = texture;
    cloudsMaterial.color.setHex(0xffffff);
    cloudsMaterial.needsUpdate = true;
    console.log('Clouds texture loaded');
  });

  const dayMaterial = new THREE.MeshBasicMaterial({
    color: 0x2244aa
  });
  const dayMesh = new THREE.Mesh(geometry.clone(), dayMaterial);
  dayMesh.visible = false;

  loader.load(dayUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    dayMaterial.map = texture;
    dayMaterial.color.setHex(0xffffff);
    dayMaterial.needsUpdate = true;
    console.log('Day texture loaded');
  });

  const pointsMaterial = new THREE.PointsMaterial({
    color: 0x4488ff,
    size: 0.03,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });
  const earthPoints = new THREE.Points(geometry.clone(), pointsMaterial);
  earthPoints.visible = false;

  const atmosphere = createAtmosphere();

  const group = new THREE.Group();
  group.add(earth);
  group.add(dayMesh);
  group.add(earthPoints);
  group.add(clouds);
  group.add(atmosphere);

  group.userData = {
    earth,
    nightMaterial,
    dayMesh,
    dayMaterial,
    earthPoints,
    clouds,
    atmosphere,
    EARTH_RADIUS,
    ROTATION_SPEED
  };

  return group;
}

export function updateEarth(earthGroup, deltaTime, elapsedTime, camera) {
  const { ROTATION_SPEED: speed } = earthGroup.userData;
  earthGroup.rotation.y += speed;
}

export function setEarthMode(earthGroup, mode) {
  const { earth, dayMesh, earthPoints, clouds, atmosphere, nightMaterial } = earthGroup.userData;
  if (!earth) return;

  const modeValues = Object.values(EARTH_MODES);
  if (!modeValues.includes(mode)) return;

  currentMode = mode;

  earth.visible = false;
  dayMesh.visible = false;
  earthPoints.visible = false;
  clouds.visible = false;
  atmosphere.visible = true;

  if (mode === EARTH_MODES.STANDARD || mode === EARTH_MODES.CITY_LIGHTS) {
    earth.visible = true;
    nightMaterial.transparent = false;
    nightMaterial.opacity = 1.0;
    nightMaterial.depthWrite = true;
    nightMaterial.needsUpdate = true;
  } else if (mode === EARTH_MODES.TRANSLUCENT) {
    earth.visible = true;
    nightMaterial.transparent = true;
    nightMaterial.opacity = 0.6;
    nightMaterial.depthWrite = false;
    nightMaterial.needsUpdate = true;
  } else if (mode === EARTH_MODES.DAYTIME) {
    dayMesh.visible = true;
  } else if (mode === EARTH_MODES.CLOUDS) {
    dayMesh.visible = true;
    clouds.visible = true;
  } else if (mode === EARTH_MODES.POINTS) {
    earthPoints.visible = true;
    atmosphere.visible = false;
  }

  console.log('Earth mode:', mode);
}

export function getCurrentEarthMode() {
  return currentMode;
}

export function getAvailableEarthModes() {
  return EARTH_MODES;
}
