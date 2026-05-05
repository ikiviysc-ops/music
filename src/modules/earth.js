import * as THREE from 'three';

const EARTH_RADIUS = 1.5;
const ROTATION_SPEED = 0.0003;

// ========== 大气层（固定半径，密集粒子） ==========
function createAtmosphere() {
  const count = 12000;
  const radius = EARTH_RADIUS * 1.08; // 统一高度

  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      void main() {
        vPosition = position;
        vNormal = normalize(position);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 1.8;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      uniform vec3 uCameraPos;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord) * 2.0;
        if (dist > 1.0) discard;
        
        // 计算视角方向与粒子法线的点积
        vec3 viewDir = normalize(uCameraPos - vPosition);
        float dotProduct = dot(normalize(vNormal), viewDir);
        
        // 只在边缘显示，正对摄像机的地方渐隐
        float edgeAlpha = 1.0 - smoothstep(0.4, 0.85, dotProduct);
        edgeAlpha = pow(edgeAlpha, 0.7);
        
        float baseAlpha = step(dist, 0.65) * 0.28;
        float alpha = baseAlpha * edgeAlpha;
        
        vec3 color = vec3(0.3, 0.6, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  // 获取相机位置并传递给 shader
  material.uniforms = {
    uCameraPos: { value: new THREE.Vector3(0, 0, 0) }
  };

  // 创建 Points 对象
  const atmosphere = new THREE.Points(geometry, material);

  // 保存 material 以便更新相机位置
  atmosphere.userData.material = material;

  return atmosphere;
}

// ========== 大陆轮廓粒子（更稀疏，间距更大，分布在大陆上） ==========
function createContinentParticles() {
  const cityClusters = [
    // 北美洲
    { lat: 40.7, lng: -74.0, spread: 10, count: 50 },
    { lat: 34.0, lng: -118.2, spread: 10, count: 35 },
    { lat: 29.7, lng: -95.3, spread: 10, count: 25 },
    { lat: 45.0, lng: -90.0, spread: 14, count: 40 },
    { lat: 35.0, lng: -100.0, spread: 17, count: 30 },
    { lat: 43.6, lng: -79.3, spread: 10, count: 20 },
    { lat: 49.2, lng: -123.1, spread: 8, count: 12 },

    // 南美洲
    { lat: -23.5, lng: -46.6, spread: 10, count: 35 },
    { lat: -34.6, lng: -58.3, spread: 9, count: 22 },
    { lat: -15.0, lng: -60.0, spread: 20, count: 35 },

    // 欧洲
    { lat: 51.5, lng: -0.1, spread: 12, count: 50 },
    { lat: 48.8, lng: 2.3, spread: 11, count: 42 },
    { lat: 52.5, lng: 13.4, spread: 12, count: 45 },
    { lat: 41.9, lng: 12.5, spread: 11, count: 30 },
    { lat: 40.4, lng: -3.7, spread: 12, count: 35 },
    { lat: 50.0, lng: 15.0, spread: 20, count: 58 },
    { lat: 55.7, lng: 37.6, spread: 12, count: 35 },

    // 印度
    { lat: 19.0, lng: 72.8, spread: 10, count: 25 },
    { lat: 28.6, lng: 77.2, spread: 10, count: 22 },
    { lat: 22.0, lng: 78.0, spread: 17, count: 32 },

    // 中国/东亚
    { lat: 39.9, lng: 116.4, spread: 12, count: 65 },
    { lat: 31.2, lng: 121.4, spread: 11, count: 58 },
    { lat: 23.1, lng: 113.2, spread: 11, count: 45 },
    { lat: 35.0, lng: 110.0, spread: 22, count: 72 },

    // 日本
    { lat: 35.6, lng: 139.6, spread: 10, count: 38 },
    { lat: 34.6, lng: 135.5, spread: 9, count: 26 },

    // 东南亚
    { lat: 1.3, lng: 103.8, spread: 9, count: 18 },
    { lat: 3.1, lng: 101.6, spread: 9, count: 18 },
    { lat: 13.7, lng: 100.5, spread: 9, count: 18 },
    { lat: 14.5, lng: 121.0, spread: 9, count: 18 },

    // 非洲北部
    { lat: 30.0, lng: 31.2, spread: 10, count: 22 },

    // 澳洲
    { lat: -33.8, lng: 151.2, spread: 10, count: 22 },
    { lat: -37.8, lng: 144.9, spread: 9, count: 18 },
  ];

  let totalCount = 0;
  cityClusters.forEach(c => totalCount += c.count);

  const positions = new Float32Array(totalCount * 3);
  const colors = new Float32Array(totalCount * 3);

  let idx = 0;
  cityClusters.forEach(cluster => {
    for (let i = 0; i < cluster.count; i++) {
      const lat = cluster.lat + (Math.random() - 0.5) * cluster.spread;
      const lng = cluster.lng + (Math.random() - 0.5) * cluster.spread;
      const r = EARTH_RADIUS + 0.008;

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = r * Math.cos(phi);
      positions[idx * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const t = Math.random();
      if (t < 0.3) {
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.95; colors[idx * 3 + 2] = 0.8;
      } else if (t < 0.6) {
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.85; colors[idx * 3 + 2] = 0.45;
      } else {
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.65; colors[idx * 3 + 2] = 0.25;
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
        gl_PointSize = 1.8;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord) * 2.0;
        if (dist > 1.0) discard;
        float alpha = step(dist, 0.65) * 0.4;
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
    color: 0x0a1018,
    emissive: 0x0a1018,
    emissiveIntensity: 0.35,
    roughness: 0.98,
    metalness: 0.0
  });

  loader.load(nightUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    material.emissiveMap = texture;
    material.emissive.set(0xffffff);
    material.emissiveIntensity = 0.9;
    material.needsUpdate = true;
    console.log('Night texture loaded successfully');
  }, undefined, (err) => {
    console.log('Night texture failed:', err);
  });

  loader.load(topologyUrl, (texture) => {
    material.bumpMap = texture;
    material.bumpScale = 0.005;
    material.needsUpdate = true;
    console.log('Topology texture loaded successfully');
  }, undefined, () => {
    console.log('Topology texture failed');
  });

  return new THREE.Mesh(geometry, material);
}

export function createEarth() {
  const earth = createEarthMesh();
  const atmosphere = createAtmosphere();
  const continents = createContinentParticles();

  const group = new THREE.Group();
  group.add(earth);
  group.add(atmosphere);
  group.add(continents);

  group.userData = { earth, atmosphere, continents, EARTH_RADIUS, ROTATION_SPEED };
  return group;
}

export function updateEarth(earthGroup, deltaTime, elapsedTime, camera) {
  const { earth, atmosphere, ROTATION_SPEED: speed } = earthGroup.userData;
  earth.rotation.y += speed;
  
  // 更新大气粒子 shader 的相机位置
  if (atmosphere && atmosphere.userData && atmosphere.userData.material) {
    const worldCameraPos = new THREE.Vector3();
    camera.getWorldPosition(worldCameraPos);
    atmosphere.userData.material.uniforms.uCameraPos.value.copy(worldCameraPos);
  }
}
