import * as THREE from 'three';

const EARTH_RADIUS = 1.5;
const ROTATION_SPEED = 0.0003;

// ========== 大气层粒子（地球边缘蓝色光点，有微弱光晕） ==========
function createAtmosphereParticles() {
  const count = 3000;
  const radius = EARTH_RADIUS * 1.08;

  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // 黄金角螺旋均匀分布
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // 大小变化：大部分小，偶尔大一些
    sizes[i] = 1.0 + Math.random() * 2.5;
    alphas[i] = 0.4 + Math.random() * 0.5;
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
        gl_PointSize = max(1.0, aSize * (60.0 / -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        // 微弱光晕：中心亮，边缘柔和衰减
        float glow = 1.0 - smoothstep(0.0, 0.5, dist);
        vec3 color = vec3(0.3, 0.6, 1.0);
        float alpha = glow * vAlpha * 0.5;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Points(geometry, material);
}

// ========== 大陆城市灯光粒子（密集、暖色、有光晕） ==========
function createContinentParticles() {
  const continentData = [
    // 北美洲 - 东海岸密集
    { lat: 40, lng: -95, spread: 20, count: 400 },
    { lat: 35, lng: -80, spread: 12, count: 300 },
    { lat: 45, lng: -75, spread: 10, count: 250 },
    { lat: 30, lng: -95, spread: 15, count: 200 },
    // 南美洲
    { lat: -20, lng: -55, spread: 18, count: 300 },
    { lat: -10, lng: -55, spread: 12, count: 200 },
    // 欧洲 - 非常密集
    { lat: 50, lng: 10, spread: 10, count: 350 },
    { lat: 45, lng: 15, spread: 8, count: 300 },
    { lat: 52, lng: -1, spread: 6, count: 200 },
    // 非洲
    { lat: 5, lng: 20, spread: 20, count: 250 },
    { lat: -25, lng: 25, spread: 12, count: 150 },
    { lat: 0, lng: 35, spread: 8, count: 100 },
    // 亚洲 - 非常密集
    { lat: 35, lng: 105, spread: 25, count: 500 },
    { lat: 25, lng: 115, spread: 15, count: 350 },
    { lat: 40, lng: 75, spread: 18, count: 300 },
    { lat: 50, lng: 85, spread: 20, count: 250 },
    { lat: 15, lng: 100, spread: 10, count: 200 },
    // 印度
    { lat: 22, lng: 78, spread: 8, count: 250 },
    // 日本/韩国
    { lat: 36, lng: 138, spread: 6, count: 180 },
    { lat: 37, lng: 127, spread: 4, count: 150 },
    // 东南亚
    { lat: 5, lng: 110, spread: 10, count: 200 },
    // 澳洲
    { lat: -30, lng: 145, spread: 12, count: 180 },
    { lat: -25, lng: 135, spread: 10, count: 120 },
    // 中东
    { lat: 25, lng: 50, spread: 10, count: 100 },
  ];

  let totalCount = 0;
  continentData.forEach(c => totalCount += c.count);

  const positions = new Float32Array(totalCount * 3);
  const sizes = new Float32Array(totalCount);
  const colors = new Float32Array(totalCount * 3);

  let idx = 0;
  continentData.forEach(cluster => {
    for (let i = 0; i < cluster.count; i++) {
      const lat = cluster.lat + (Math.random() - 0.5) * cluster.spread;
      const lng = cluster.lng + (Math.random() - 0.5) * cluster.spread;
      const r = EARTH_RADIUS + 0.005 + Math.random() * 0.01;

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = r * Math.cos(phi);
      positions[idx * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // 大小变化：大部分小，偶尔有较大的亮点
      sizes[idx] = 0.8 + Math.random() * 2.0;

      // 暖色调：城市灯光颜色
      const t = Math.random();
      if (t < 0.25) {
        // 暖白
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.95; colors[idx * 3 + 2] = 0.85;
      } else if (t < 0.5) {
        // 黄色
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.85; colors[idx * 3 + 2] = 0.4;
      } else if (t < 0.75) {
        // 橙色
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.65; colors[idx * 3 + 2] = 0.25;
      } else if (t < 0.9) {
        // 淡黄
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.9; colors[idx * 3 + 2] = 0.5;
      } else {
        // 偶尔冷白
        colors[idx * 3] = 0.9; colors[idx * 3 + 1] = 0.95; colors[idx * 3 + 2] = 1.0;
      }

      idx++;
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float aSize;
      attribute vec3 aColor;
      varying vec3 vColor;
      varying float vSize;
      void main() {
        vColor = aColor;
        vSize = aSize;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(1.0, aSize * (70.0 / -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vSize;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        // 中心亮，边缘柔和衰减
        float glow = 1.0 - smoothstep(0.0, 0.45, dist);
        float alpha = glow * 0.6;
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
