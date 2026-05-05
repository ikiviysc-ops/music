import * as THREE from 'three';

const EARTH_RADIUS = 1.5;
const ROTATION_SPEED = 0.0003;

function createAtmosphereParticles() {
  const count = 400;
  const innerRadius = EARTH_RADIUS * 1.08;
  const outerRadius = EARTH_RADIUS * 1.18;

  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = innerRadius + Math.random() * (outerRadius - innerRadius);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    sizes[i] = 0.4 + Math.random() * 1.2;
    alphas[i] = 0.15 + Math.random() * 0.35;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float aSize;
      attribute float aAlpha;
      varying float vAlpha;
      void main() {
        vAlpha = aAlpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(0.3, aSize * (50.0 / -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float glow = 1.0 - dist * 2.0;
        glow = pow(glow, 2.0);
        vec3 color = vec3(0.2, 0.5, 0.9);
        float alpha = glow * vAlpha * 0.25;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Points(geometry, material);
}

function createFallbackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#060e1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const continentPaths = [
    { path: [[0.12,0.18],[0.14,0.14],[0.18,0.12],[0.24,0.11],[0.30,0.12],[0.34,0.14],[0.37,0.18],[0.38,0.24],[0.36,0.30],[0.33,0.34],[0.28,0.37],[0.24,0.38],[0.20,0.36],[0.16,0.32],[0.13,0.26]] },
    { path: [[0.25,0.42],[0.28,0.40],[0.31,0.42],[0.33,0.46],[0.34,0.52],[0.33,0.58],[0.31,0.64],[0.28,0.68],[0.25,0.66],[0.23,0.60],[0.22,0.54],[0.23,0.48]] },
    { path: [[0.48,0.16],[0.50,0.14],[0.53,0.13],[0.56,0.14],[0.58,0.16],[0.57,0.20],[0.55,0.24],[0.52,0.26],[0.49,0.25],[0.47,0.22],[0.46,0.19]] },
    { path: [[0.49,0.30],[0.52,0.28],[0.56,0.29],[0.59,0.32],[0.61,0.38],[0.62,0.44],[0.60,0.52],[0.57,0.58],[0.54,0.60],[0.51,0.58],[0.48,0.52],[0.47,0.44],[0.47,0.36]] },
    { path: [[0.60,0.12],[0.65,0.10],[0.72,0.11],[0.80,0.12],[0.86,0.14],[0.90,0.18],[0.91,0.24],[0.88,0.30],[0.84,0.34],[0.78,0.37],[0.72,0.38],[0.66,0.36],[0.62,0.32],[0.59,0.26],[0.58,0.20]] },
    { path: [[0.68,0.32],[0.71,0.30],[0.74,0.32],[0.73,0.38],[0.71,0.42],[0.68,0.40],[0.67,0.36]] },
    { path: [[0.78,0.34],[0.80,0.32],[0.83,0.34],[0.84,0.38],[0.82,0.42],[0.79,0.44],[0.77,0.40],[0.76,0.36]] },
    { path: [[0.82,0.52],[0.86,0.50],[0.90,0.52],[0.92,0.56],[0.90,0.60],[0.86,0.62],[0.82,0.60],[0.80,0.56]] },
    { path: [[0.10,0.90],[0.30,0.88],[0.50,0.87],[0.70,0.88],[0.90,0.90],[0.92,0.94],[0.80,0.96],[0.50,0.97],[0.20,0.96],[0.08,0.94]] }
  ];

  continentPaths.forEach(continent => {
    ctx.fillStyle = '#0d3320';
    ctx.beginPath();
    const first = continent.path[0];
    ctx.moveTo(first[0] * canvas.width, first[1] * canvas.height);
    for (let i = 1; i < continent.path.length; i++) {
      const p = continent.path[i];
      ctx.lineTo(p[0] * canvas.width, p[1] * canvas.height);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 200, 120, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 150, 0.15)';
    ctx.lineWidth = 8;
    ctx.stroke();
  });

  const cityLights = [
    [0.22,0.22],[0.26,0.20],[0.30,0.26],[0.28,0.30],[0.34,0.18],
    [0.28,0.50],[0.30,0.56],[0.26,0.60],
    [0.52,0.20],[0.54,0.18],[0.50,0.22],[0.56,0.22],
    [0.54,0.36],[0.56,0.42],[0.52,0.48],
    [0.70,0.20],[0.76,0.22],[0.82,0.18],[0.86,0.22],[0.72,0.28],
    [0.70,0.36],[0.72,0.40],
    [0.80,0.36],[0.82,0.40],
    [0.86,0.54],[0.88,0.56]
  ];

  cityLights.forEach(([x, y]) => {
    const cx = x * canvas.width;
    const cy = y * canvas.height;
    const size = 2 + Math.random() * 2;
    const glowRadius = size * 12;

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    glow.addColorStop(0, 'rgba(255, 230, 150, 0.9)');
    glow.addColorStop(0.2, 'rgba(255, 200, 100, 0.5)');
    glow.addColorStop(0.5, 'rgba(255, 180, 80, 0.15)');
    glow.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 250, 230, 0.95)';
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 0.8 + 0.2;
    const alpha = Math.random() * 0.25 + 0.05;
    ctx.fillStyle = `rgba(255, 230, 180, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function createEarth() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);

  const loader = new THREE.TextureLoader();
  const nightUrl = 'https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg';
  const topologyUrl = 'https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png';

  const fallbackTexture = createFallbackTexture();

  const material = new THREE.MeshStandardMaterial({
    map: fallbackTexture,
    emissive: 0x112233,
    emissiveIntensity: 0.3,
    emissiveMap: fallbackTexture,
    roughness: 0.85,
    metalness: 0.05
  });

  loader.load(nightUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    material.emissiveMap = texture;
    material.emissive.set(0xffffff);
    material.emissiveIntensity = 0.5;
    material.needsUpdate = true;
    console.log('Night texture loaded successfully');
  }, (progress) => {
    if (progress.total > 0) {
      console.log('Night texture loading:', Math.round(progress.loaded / progress.total * 100) + '%');
    }
  }, (err) => {
    console.log('Night texture failed, using fallback:', err);
  });

  loader.load(topologyUrl, (texture) => {
    material.bumpMap = texture;
    material.bumpScale = 0.015;
    material.needsUpdate = true;
    console.log('Topology texture loaded successfully');
  }, undefined, () => {
    console.log('Topology texture failed, using flat surface');
  });

  const earth = new THREE.Mesh(geometry, material);
  const atmosphere = createAtmosphereParticles();

  const group = new THREE.Group();
  group.add(earth);
  group.add(atmosphere);

  group.userData = { earth, atmosphere, EARTH_RADIUS, ROTATION_SPEED };
  return group;
}

export function updateEarth(earthGroup, deltaTime, elapsedTime) {
  const { earth, ROTATION_SPEED: speed } = earthGroup.userData;
  earth.rotation.y += speed;
}
