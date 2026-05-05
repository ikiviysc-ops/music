import * as THREE from 'three';

const EARTH_RADIUS = 4.5;
const ROTATION_SPEED = 0.0006;

const ATMOSPHERE_CONFIG = {
  radius: EARTH_RADIUS * 1.2,
  color: new THREE.Color(0x0088ff),
  intensityPower: 3.5,
  intensityBase: 0.7,
  opacity: 0.8
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
    float pulse = 0.9 + sin(uTime * 0.4) * 0.1;
    float intensity = fresnel * pulse;
    vec3 color = uColor * (0.9 + 0.1 * sin(uTime * 0.6 + vPosition.x * 1.5));
    gl_FragColor = vec4(color, intensity * uOpacity);
  }
`;

const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const earthFragmentShader = `
  uniform sampler2D uTexture;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  
  void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    float fresnel = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
    
    vec3 baseColor = texColor.rgb;
    vec3 edgeGlow = vec3(0.0, 0.25, 0.5) * fresnel * 0.4;
    vec3 color = baseColor + edgeGlow;
    
    gl_FragColor = vec4(color, 1.0);
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

  ctx.fillStyle = '#0a0d1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const continents = [
    { x: 0.43, y: 0.34, w: 0.18, h: 0.25, color: '#0f2035' },
    { x: 0.53, y: 0.23, w: 0.14, h: 0.16, color: '#112238' },
    { x: 0.73, y: 0.29, w: 0.10, h: 0.14, color: '#0d1d30' },
    { x: 0.17, y: 0.26, w: 0.12, h: 0.16, color: '#102035' },
    { x: 0.21, y: 0.46, w: 0.14, h: 0.20, color: '#0e1f32' },
    { x: 0.51, y: 0.56, w: 0.07, h: 0.09, color: '#0f1f33' },
    { x: 0.83, y: 0.63, w: 0.06, h: 0.07, color: '#0e1e31' },
  ];

  continents.forEach(c => {
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.ellipse(c.x * canvas.width, c.y * canvas.height, c.w * canvas.width * 0.5, c.h * canvas.height * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const gradient = ctx.createRadialGradient(c.x * canvas.width, c.y * canvas.height, 0, c.x * canvas.width, c.y * canvas.height, 80);
    gradient.addColorStop(0, 'rgba(100, 140, 200, 0.1)');
    gradient.addColorStop(1, 'rgba(50, 70, 100, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(c.x * canvas.width, c.y * canvas.height, c.w * canvas.width * 0.8, c.h * canvas.height * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 0.5 + 0.3;
    const alpha = Math.random() * 0.12 + 0.04;
    const hue = 200 + Math.random() * 30;
    ctx.fillStyle = `hsla(${hue}, 30%, 60%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const cityHotspots = [
    { x: 0.56, y: 0.36, size: 4, brightness: 1.0, color: '#fff0d0' },
    { x: 0.78, y: 0.32, size: 5, brightness: 1.0, color: '#fff5e0' },
    { x: 0.23, y: 0.29, size: 4, brightness: 0.95, color: '#ffe8c8' },
    { x: 0.52, y: 0.28, size: 3.5, brightness: 0.9, color: '#ffeecc' },
    { x: 0.84, y: 0.70, size: 3.5, brightness: 0.9, color: '#fff3d8' },
    { x: 0.56, y: 0.64, size: 3, brightness: 0.85, color: '#fff0d0' },
    { x: 0.31, y: 0.61, size: 2.5, brightness: 0.75, color: '#ffeac8' },
    { x: 0.81, y: 0.66, size: 2.5, brightness: 0.7, color: '#fff2d0' },
  ];

  cityHotspots.forEach(city => {
    const cx = city.x * canvas.width;
    const cy = city.y * canvas.height;
    const glowRadius = city.size * 15;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    gradient.addColorStop(0, city.color);
    gradient.addColorStop(0.3, `rgba(255, 200, 120, ${city.brightness * 0.5})`);
    gradient.addColorStop(0.7, `rgba(200, 120, 60, ${city.brightness * 0.25})`);
    gradient.addColorStop(1, 'rgba(100, 60, 30, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = city.color;
    ctx.globalAlpha = city.brightness;
    ctx.beginPath();
    ctx.arc(cx, cy, city.size * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  const cityData = [
    { x: 0.55, y: 0.35, size: 2.5, brightness: 0.9 },
    { x: 0.57, y: 0.37, size: 1.5, brightness: 0.7 },
    { x: 0.53, y: 0.34, size: 1.5, brightness: 0.65 },
    { x: 0.77, y: 0.31, size: 3, brightness: 0.95 },
    { x: 0.79, y: 0.33, size: 1.8, brightness: 0.75 },
    { x: 0.75, y: 0.29, size: 1.5, brightness: 0.7 },
    { x: 0.22, y: 0.28, size: 2.5, brightness: 0.9 },
    { x: 0.25, y: 0.31, size: 1.5, brightness: 0.65 },
    { x: 0.50, y: 0.27, size: 2.2, brightness: 0.85 },
    { x: 0.54, y: 0.26, size: 1.5, brightness: 0.7 },
    { x: 0.47, y: 0.25, size: 1.5, brightness: 0.65 },
    { x: 0.54, y: 0.63, size: 2.2, brightness: 0.8 },
    { x: 0.58, y: 0.65, size: 1.5, brightness: 0.65 },
    { x: 0.29, y: 0.60, size: 1.8, brightness: 0.75 },
    { x: 0.79, y: 0.65, size: 1.5, brightness: 0.65 },
    { x: 0.83, y: 0.69, size: 2.2, brightness: 0.85 },
    { x: 0.64, y: 0.40, size: 1.2, brightness: 0.45 },
    { x: 0.69, y: 0.42, size: 1.2, brightness: 0.45 },
    { x: 0.34, y: 0.35, size: 1.2, brightness: 0.5 },
    { x: 0.39, y: 0.32, size: 1.2, brightness: 0.45 },
  ];

  cityData.forEach(city => {
    const cx = city.x * canvas.width;
    const cy = city.y * canvas.height;
    const glowRadius = city.size * 8;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    gradient.addColorStop(0, `rgba(255, 220, 160, ${city.brightness * 0.6})`);
    gradient.addColorStop(0.4, `rgba(255, 180, 100, ${city.brightness * 0.35})`);
    gradient.addColorStop(1, 'rgba(150, 90, 40, 0)');
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
