import * as THREE from 'three';

const EARTH_RADIUS = 1.5;
const ROTATION_SPEED = 0.0003;

// ========== 大气层粒子（均匀分布，固定高度，1px 亮点） ==========
function createAtmosphereParticles() {
  const count = 2500;
  const radius = EARTH_RADIUS * 1.12; // 固定单一高度

  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // 均匀分布：用黄金角螺旋
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
        // 固定 1px 大小，不随距离变化
        gl_PointSize = 1.0;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        // 1px 硬边小亮点
        float alpha = step(dist, 0.25) * 0.6;
        vec3 color = vec3(0.4, 0.7, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Points(geometry, material);
}

// ========== 大陆板块粒子（1px 小亮点） ==========
function createContinentParticles() {
  const continentData = [
    { lat: 45, lng: -100, spread: 25, count: 300 },
    { lat: 35, lng: -110, spread: 20, count: 200 },
    { lat: 55, lng: -95, spread: 15, count: 150 },
    { lat: -15, lng: -60, spread: 20, count: 250 },
    { lat: -25, lng: -55, spread: 15, count: 180 },
    { lat: 50, lng: 15, spread: 12, count: 200 },
    { lat: 45, lng: 5, spread: 10, count: 150 },
    { lat: 5, lng: 20, spread: 22, count: 300 },
    { lat: -20, lng: 25, spread: 15, count: 200 },
    { lat: 35, lng: 100, spread: 28, count: 400 },
    { lat: 50, lng: 80, spread: 20, count: 250 },
    { lat: 25, lng: 110, spread: 15, count: 200 },
    { lat: 22, lng: 78, spread: 8, count: 120 },
    { lat: 5, lng: 115, spread: 10, count: 150 },
    { lat: -25, lng: 135, spread: 12, count: 180 },
    { lat: 36, lng: 138, spread: 5, count: 80 },
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
      const r = EARTH_RADIUS + 0.01;

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = r * Math.cos(phi);
      positions[idx * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const t = Math.random();
      if (t < 0.3) {
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.9; colors[idx * 3 + 2] = 0.6;
      } else if (t < 0.6) {
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.7; colors[idx * 3 + 2] = 0.3;
      } else if (t < 0.85) {
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.5; colors[idx * 3 + 2] = 0.2;
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
        // 固定 1px 大小
        gl_PointSize = 1.0;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        // 1px 硬边小亮点
        float alpha = step(dist, 0.25) * 0.8;
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
    color: 0x0a1525,
    emissive: 0x0a1525,
    emissiveIntensity: 0.15,
    roughness: 0.9,
    metalness: 0.0
  });

  loader.load(nightUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    material.emissiveMap = texture;
    material.emissive.set(0xffffff);
    material.emissiveIntensity = 0.4;
    material.needsUpdate = true;
    console.log('Night texture loaded successfully');
  }, undefined, (err) => {
    console.log('Night texture failed:', err);
  });

  loader.load(topologyUrl, (texture) => {
    material.bumpMap = texture;
    material.bumpScale = 0.01;
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
