import * as THREE from 'three';

const EARTH_RADIUS = 5;
const ROTATION_SPEED = 0.0008;
const EMISSIVE_INTENSITY = 0.6;

const ATMOSPHERE_CONFIG = {
  radius: EARTH_RADIUS * 1.18,
  color: new THREE.Color(0x00D1FF),
  intensityPower: 4.0,
  intensityBase: 0.65,
  opacity: 0.7
};

const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 uColor;
  uniform float uIntensityBase;
  uniform float uIntensityPower;
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    float fresnel = pow(uIntensityBase - dot(vNormal, vec3(0.0, 0.0, 1.0)), uIntensityPower);
    float pulse = 0.95 + sin(uTime * 0.3) * 0.05;
    float intensity = fresnel * pulse;
    vec3 color = uColor * (0.8 + 0.2 * sin(uTime * 0.5 + vPosition.x * 2.0));
    gl_FragColor = vec4(color, intensity * uOpacity);
  }
`;

const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vPosition = position;
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const earthFragmentShader = `
  uniform sampler2D uTexture;
  uniform vec3 uEmissiveColor;
  uniform float uEmissiveIntensity;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  
  void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    float fresnel = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    
    vec3 baseColor = texColor.rgb;
    vec3 edgeGlow = vec3(0.0, 0.4, 0.8) * fresnel * 0.3;
    vec3 color = baseColor + edgeGlow;
    
    float nightFactor = max(0.0, texColor.r + texColor.g + texColor.b - 0.2);
    vec3 emissiveColor = uEmissiveColor * nightFactor * uEmissiveIntensity;
    
    gl_FragColor = vec4(color + emissiveColor, 1.0);
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
      uOpacity: { value: ATMOSPHERE_CONFIG.opacity },
      uTime: { value: 0 }
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

  ctx.fillStyle = '#050814';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const continents = [
    { x: 0.45, y: 0.32, w: 0.15, h: 0.2 },
    { x: 0.52, y: 0.22, w: 0.12, h: 0.15 },
    { x: 0.72, y: 0.28, w: 0.08, h: 0.12 },
    { x: 0.18, y: 0.25, w: 0.1, h: 0.15 },
    { x: 0.2, y: 0.45, w: 0.12, h: 0.18 },
    { x: 0.5, y: 0.55, w: 0.06, h: 0.08 },
    { x: 0.82, y: 0.62, w: 0.05, h: 0.06 },
  ];

  continents.forEach(c => {
    ctx.fillStyle = 'rgba(15, 30, 60, 0.85)';
    ctx.beginPath();
    ctx.ellipse(c.x * canvas.width, c.y * canvas.height, c.w * canvas.width * 0.5, c.h * canvas.height * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const gradient = ctx.createRadialGradient(c.x * canvas.width, c.y * canvas.height, 0, c.x * canvas.width, c.y * canvas.height, 60);
    gradient.addColorStop(0, 'rgba(255, 180, 100, 0.08)');
    gradient.addColorStop(1, 'rgba(100, 80, 60, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(c.x * canvas.width, c.y * canvas.height, c.w * canvas.width * 0.7, c.h * canvas.height * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  const cityData = [
    { x: 0.55, y: 0.35, size: 3.5, brightness: 1.0 },
    { x: 0.56, y: 0.36, size: 2, brightness: 0.8 },
    { x: 0.52, y: 0.33, size: 2, brightness: 0.7 },
    { x: 0.77, y: 0.30, size: 4.5, brightness: 1.0 },
    { x: 0.78, y: 0.32, size: 2.2, brightness: 0.8 },
    { x: 0.76, y: 0.28, size: 2, brightness: 0.7 },
    { x: 0.22, y: 0.28, size: 3.5, brightness: 0.95 },
    { x: 0.24, y: 0.30, size: 2, brightness: 0.7 },
    { x: 0.51, y: 0.28, size: 3.2, brightness: 1.0 },
    { x: 0.53, y: 0.26, size: 2, brightness: 0.8 },
    { x: 0.48, y: 0.25, size: 2, brightness: 0.7 },
    { x: 0.55, y: 0.62, size: 3.2, brightness: 0.9 },
    { x: 0.57, y: 0.64, size: 2, brightness: 0.7 },
    { x: 0.30, y: 0.60, size: 2.2, brightness: 0.8 },
    { x: 0.80, y: 0.65, size: 2, brightness: 0.7 },
    { x: 0.82, y: 0.68, size: 3, brightness: 0.95 },
    { x: 0.65, y: 0.40, size: 1.5, brightness: 0.5 },
    { x: 0.70, y: 0.42, size: 1.5, brightness: 0.5 },
    { x: 0.35, y: 0.35, size: 1.5, brightness: 0.6 },
    { x: 0.40, y: 0.32, size: 1.5, brightness: 0.5 },
  ];

  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 0.4 + 0.2;
    const alpha = Math.random() * 0.1 + 0.03;
    ctx.fillStyle = `rgba(120, 150, 220, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  cityData.forEach(city => {
    const cx = city.x * canvas.width;
    const cy = city.y * canvas.height;
    const glowRadius = city.size * 12;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    gradient.addColorStop(0, `rgba(255, 230, 180, ${city.brightness * 0.7})`);
    gradient.addColorStop(0.25, `rgba(255, 190, 120, ${city.brightness * 0.45})`);
    gradient.addColorStop(0.6, `rgba(180, 120, 60, ${city.brightness * 0.2})`);
    gradient.addColorStop(1, 'rgba(100, 60, 30, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 245, 220, ${city.brightness})`;
    ctx.beginPath();
    ctx.arc(cx, cy, city.size, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createEarth() {
  const isMobile = window.innerWidth <= 480;
  const segments = isMobile ? 48 : 64;

  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, segments, segments);
  const texture = createEarthTexture();

  const material = new THREE.ShaderMaterial({
    vertexShader: earthVertexShader,
    fragmentShader: earthFragmentShader,
    uniforms: {
      uTexture: { value: texture },
      uEmissiveColor: { value: new THREE.Color(0xffffff) },
      uEmissiveIntensity: { value: EMISSIVE_INTENSITY },
      uTime: { value: 0 }
    },
    transparent: false
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
  
  if (atmosphere.material.uniforms && atmosphere.material.uniforms.uTime) {
    atmosphere.material.uniforms.uTime.value = elapsedTime;
  }
  if (earth.material.uniforms && earth.material.uniforms.uTime) {
    earth.material.uniforms.uTime.value = elapsedTime;
  }
}
