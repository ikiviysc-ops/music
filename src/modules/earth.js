import * as THREE from 'three';

const EARTH_RADIUS = 5;
const ROTATION_SPEED = 0.0008;
const EMISSIVE_INTENSITY = 0.4;

const ATMOSPHERE_CONFIG = {
  radius: EARTH_RADIUS * 1.15,
  color: new THREE.Color(0x00D1FF),
  intensityPower: 3.0,
  intensityBase: 0.8,
  opacity: 0.6
};

const atmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 uColor;
  uniform float uIntensityBase;
  uniform float uIntensityPower;
  uniform float uOpacity;
  varying vec3 vNormal;
  
  void main() {
    float intensity = pow(uIntensityBase - dot(vNormal, vec3(0.0, 0.0, 1.0)), uIntensityPower);
    gl_FragColor = vec4(uColor, intensity * uOpacity);
  }
`;

function createAtmosphere() {
  const geometry = new THREE.SphereGeometry(ATMOSPHERE_CONFIG.radius, 64, 64);
  const material = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: {
      uColor: { value: ATMOSPHERE_CONFIG.color },
      uIntensityBase: { value: ATMOSPHERE_CONFIG.intensityBase },
      uIntensityPower: { value: ATMOSPHERE_CONFIG.intensityPower },
      uOpacity: { value: ATMOSPHERE_CONFIG.opacity }
    },
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });

  return new THREE.Mesh(geometry, material);
}

function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cityData = [
    { x: 0.55, y: 0.35, size: 3, brightness: 0.9 },
    { x: 0.56, y: 0.36, size: 2, brightness: 0.7 },
    { x: 0.52, y: 0.33, size: 2, brightness: 0.6 },
    { x: 0.77, y: 0.30, size: 4, brightness: 1.0 },
    { x: 0.78, y: 0.32, size: 2, brightness: 0.7 },
    { x: 0.76, y: 0.28, size: 2, brightness: 0.6 },
    { x: 0.22, y: 0.28, size: 3, brightness: 0.8 },
    { x: 0.24, y: 0.30, size: 2, brightness: 0.6 },
    { x: 0.51, y: 0.28, size: 3, brightness: 0.9 },
    { x: 0.53, y: 0.26, size: 2, brightness: 0.7 },
    { x: 0.48, y: 0.25, size: 2, brightness: 0.6 },
    { x: 0.55, y: 0.62, size: 3, brightness: 0.8 },
    { x: 0.57, y: 0.64, size: 2, brightness: 0.6 },
    { x: 0.30, y: 0.60, size: 2, brightness: 0.7 },
    { x: 0.80, y: 0.65, size: 2, brightness: 0.6 },
    { x: 0.82, y: 0.68, size: 3, brightness: 0.8 },
    { x: 0.65, y: 0.40, size: 2, brightness: 0.5 },
    { x: 0.70, y: 0.42, size: 2, brightness: 0.5 },
    { x: 0.35, y: 0.35, size: 2, brightness: 0.6 },
    { x: 0.40, y: 0.32, size: 2, brightness: 0.5 },
  ];

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 0.5 + 0.2;
    const alpha = Math.random() * 0.15 + 0.02;
    ctx.fillStyle = `rgba(100, 120, 180, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  cityData.forEach(city => {
    const cx = city.x * canvas.width;
    const cy = city.y * canvas.height;
    const glowRadius = city.size * 8;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    gradient.addColorStop(0, `rgba(255, 220, 150, ${city.brightness * 0.6})`);
    gradient.addColorStop(0.3, `rgba(255, 180, 100, ${city.brightness * 0.3})`);
    gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 240, 200, ${city.brightness})`;
    ctx.beginPath();
    ctx.arc(cx, cy, city.size, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createEarth() {
  const isMobile = window.innerWidth <= 480;
  const segments = isMobile ? 48 : 64;

  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, segments, segments);
  const texture = createEarthTexture();

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: EMISSIVE_INTENSITY,
    roughness: 0.8,
    metalness: 0.1
  });

  const earth = new THREE.Mesh(geometry, material);

  const atmosphere = createAtmosphere();

  const group = new THREE.Group();
  group.add(earth);
  group.add(atmosphere);

  group.userData = { earth, atmosphere, EARTH_RADIUS, ROTATION_SPEED };

  return group;
}

export function updateEarth(earthGroup, deltaTime) {
  const { earth, ROTATION_SPEED: speed } = earthGroup.userData;
  earth.rotation.y += speed;
}
