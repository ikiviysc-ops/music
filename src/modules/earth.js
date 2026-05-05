import * as THREE from 'three';

const EARTH_RADIUS = 2.0;
const ROTATION_SPEED = 0.0006;

function createAtmosphere() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.15, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0x0088ff,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide
  });
  return new THREE.Mesh(geometry, material);
}

function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const continents = [
    { x: 0.4, y: 0.3, w: 0.2, h: 0.25, color: '#0a1828' },
    { x: 0.55, y: 0.25, w: 0.15, h: 0.18, color: '#0a1a2b' },
    { x: 0.75, y: 0.3, w: 0.1, h: 0.15, color: '#081525' },
    { x: 0.2, y: 0.3, w: 0.12, h: 0.18, color: '#091626' },
    { x: 0.25, y: 0.45, w: 0.14, h: 0.2, color: '#081525' },
  ];

  continents.forEach(c => {
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.ellipse(c.x * canvas.width, c.y * canvas.height, c.w * canvas.width * 0.5, c.h * canvas.height * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 0.8 + 0.4;
    const alpha = Math.random() * 0.25 + 0.08;
    ctx.fillStyle = `rgba(255, 240, 200, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const cityHotspots = [
    { x: 0.56, y: 0.36, size: 6 },
    { x: 0.78, y: 0.32, size: 7 },
    { x: 0.23, y: 0.29, size: 6 },
    { x: 0.52, y: 0.28, size: 5 },
    { x: 0.84, y: 0.70, size: 5 },
  ];

  cityHotspots.forEach(city => {
    const cx = city.x * canvas.width;
    const cy = city.y * canvas.height;
    const glowRadius = city.size * 10;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    gradient.addColorStop(0, 'rgba(255, 240, 200, 0.9)');
    gradient.addColorStop(0.4, 'rgba(255, 180, 120, 0.4)');
    gradient.addColorStop(1, 'rgba(200, 120, 60, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 245, 220, 0.95)';
    ctx.beginPath();
    ctx.arc(cx, cy, city.size * 1.2, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function createEarth() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
  const texture = createEarthTexture();

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: 0x112233,
    emissiveIntensity: 0.4
  });

  const earth = new THREE.Mesh(geometry, material);
  const atmosphere = createAtmosphere();

  const group = new THREE.Group();
  group.add(earth);
  group.add(atmosphere);

  group.userData = { earth, atmosphere, EARTH_RADIUS, ROTATION_SPEED };
  return group;
}

export function updateEarth(earthGroup, deltaTime, elapsedTime) {
  const { earth, atmosphere, ROTATION_SPEED: speed } = earthGroup.userData;
  earth.rotation.y += speed;
}
