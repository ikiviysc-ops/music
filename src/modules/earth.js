import * as THREE from 'three';

const EARTH_RADIUS = 1.5;
const ROTATION_SPEED = 0.0003;

// ========== 大气层粒子（纯亮点，无光晕，更小更暗） ==========
function createAtmosphereParticles() {
  const count = 3000;
  const radius = EARTH_RADIUS * 1.08;

  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 1.5;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        // 纯硬边亮点，无shader光晕，靠Bloom发光
        float alpha = step(dist, 0.35) * 0.95;
        vec3 color = vec3(0.6, 0.85, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Points(geometry, material);
}

// ========== 大陆城市灯光粒子（纯亮点，无光晕，更小更暗） ==========
function createContinentParticles() {
  const continentData = [
    { lat: 40, lng: -95, spread: 20, count: 400 },
    { lat: 35, lng: -80, spread: 12, count: 300 },
    { lat: 45, lng: -75, spread: 10, count: 250 },
    { lat: 30, lng: -95, spread: 15, count: 200 },
    { lat: -20, lng: -55, spread: 18, count: 300 },
    { lat: -10, lng: -55, spread: 12, count: 200 },
    { lat: 50, lng: 10, spread: 10, count: 350 },
    { lat: 45, lng: 15, spread: 8, count: 300 },
    { lat: 52, lng: -1, spread: 6, count: 200 },
    { lat: 5, lng: 20, spread: 20, count: 250 },
    { lat: -25, lng: 25, spread: 12, count: 150 },
    { lat: 0, lng: 35, spread: 8, count: 100 },
    { lat: 35, lng: 105, spread: 25, count: 500 },
    { lat: 25, lng: 115, spread: 15, count: 350 },
    { lat: 40, lng: 75, spread: 18, count: 300 },
    { lat: 50, lng: 85, spread: 20, count: 250 },
    { lat: 15, lng: 100, spread: 10, count: 200 },
    { lat: 22, lng: 78, spread: 8, count: 250 },
    { lat: 36, lng: 138, spread: 6, count: 180 },
    { lat: 37, lng: 127, spread: 4, count: 150 },
    { lat: 5, lng: 110, spread: 10, count: 200 },
    { lat: -30, lng: 145, spread: 12, count: 180 },
    { lat: -25, lng: 135, spread: 10, count: 120 },
    { lat: 25, lng: 50, spread: 10, count: 100 },
  ];

  let totalCount = 0;
  continentData.forEach(c => totalCount += c.count);

  const positions = new Float32Array(totalCount * 3);
  const colors = new Float32Array(totalCount * 3);

  let idx = 0;
  continentData.forEach(cluster => {
    for (let i = 0; i < cluster.count; i++) {
      const lat = cluster.lat + (Math.random() - 0.5) * cluster.spread;
      const lng = cluster.lng + (Math.random() - 0.5) * cluster.spread;
      const r = EARTH_RADIUS + 0.005;

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = r * Math.cos(phi);
      positions[idx * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const t = Math.random();
      if (t < 0.3) {
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.9; colors[idx * 3 + 2] = 0.7;
      } else if (t < 0.6) {
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.8; colors[idx * 3 + 2] = 0.4;
      } else if (t < 0.85) {
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.65; colors[idx * 3 + 2] = 0.25;
      } else {
        colors[idx * 3] = 0.9; colors[idx * 3 + 1] = 0.95; colors[idx * 3 + 2] = 1.0;
      }

      idx++;
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      attribute vec3 aColor;
      varying vec3 vColor;
      void main() {
        vColor = aColor;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 1.2;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        // 纯硬边亮点，无shader光晕，靠Bloom发光
        float alpha = step(dist, 0.35) * 0.95;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Points(geometry, material);
}

// ========== 地球本体 ==========
function createEarthMesh() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);

  const loader = new THREE.TextureLoader();
  const nightUrl = 'https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg';
  const topologyUrl = 'https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png';

  const material = new THREE.MeshStandardMaterial({
    color: 0x080e18,
    emissive: 0x080e18,
    emissiveIntensity: 0.1,
    roughness: 0.95,
    metalness: 0.0
  });

  loader.load(nightUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    material.emissiveMap = texture;
    material.emissive.set(0xffffff);
    material.emissiveIntensity = 0.35;
    material.needsUpdate = true;
    console.log('Night texture loaded successfully');
  }, undefined, (err) => {
    console.log('Night texture failed:', err);
  });

  loader.load(topologyUrl, (texture) => {
    material.bumpMap = texture;
    material.bumpScale = 0.008;
    material.needsUpdate = true;
    console.log('Topology texture loaded successfully');
  }, undefined, () => {
    console.log('Topology texture failed');
  });

  return new THREE.Mesh(geometry, material);
}

export function createEarth() {
  const earth = createEarthMesh();
  const atmosphere = createAtmosphereParticles();
  const continents = createContinentParticles();

  const group = new THREE.Group();
  group.add(earth);
  group.add(atmosphere);
  group.add(continents);

  group.userData = { earth, atmosphere, continents, EARTH_RADIUS, ROTATION_SPEED };
  return group;
}

export function updateEarth(earthGroup, deltaTime, elapsedTime) {
  const { earth, ROTATION_SPEED: speed } = earthGroup.userData;
  earth.rotation.y += speed;
}
