import * as THREE from 'three';

const EARTH_RADIUS = 1.5;
const ROTATION_SPEED = 0.0003;

// ========== 大气层（连续发光薄壳，Fresnel Shader） ==========
function createAtmosphere() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.04, 64, 64);
  const material = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        vec3 normal = normalize(vNormal);
        float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.5);
        vec3 color = vec3(0.2, 0.5, 0.9);
        float alpha = fresnel * 0.25;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });

  return new THREE.Mesh(geometry, material);
}

// ========== 大陆城市灯光粒子（密集、随机、暖色） ==========
function createContinentParticles() {
  // 更精细的地理分布，模拟真实城市灯光密度
  const cityClusters = [
    // 北美洲东海岸城市群
    { lat: 40.7, lng: -74.0, spread: 3, count: 80 },   // 纽约
    { lat: 34.0, lng: -118.2, spread: 4, count: 60 },  // 洛杉矶
    { lat: 41.8, lng: -87.6, spread: 3, count: 50 },   // 芝加哥
    { lat: 29.7, lng: -95.3, spread: 4, count: 40 },   // 休斯顿
    { lat: 33.7, lng: -84.3, spread: 3, count: 35 },   // 亚特兰大
    { lat: 47.6, lng: -122.3, spread: 3, count: 30 },  // 西雅图
    { lat: 39.9, lng: -75.1, spread: 2, count: 25 },   // 费城
    { lat: 25.7, lng: -80.1, spread: 3, count: 25 },   // 迈阿密
    { lat: 38.9, lng: -77.0, spread: 2, count: 25 },   // 华盛顿
    { lat: 42.3, lng: -71.0, spread: 2, count: 20 },   // 波士顿
    { lat: 32.7, lng: -117.1, spread: 3, count: 20 },  // 圣地亚哥
    { lat: 37.7, lng: -122.4, spread: 2, count: 20 },  // 旧金山
    // 美国中西部填充
    { lat: 39.0, lng: -98.5, spread: 15, count: 60 },
    { lat: 35.0, lng: -100.0, spread: 12, count: 40 },
    // 加拿大
    { lat: 43.6, lng: -79.3, spread: 3, count: 30 },   // 多伦多
    { lat: 45.5, lng: -73.5, spread: 2, count: 20 },   // 蒙特利尔
    { lat: 49.2, lng: -123.1, spread: 2, count: 15 },  // 温哥华

    // 南美洲
    { lat: -23.5, lng: -46.6, spread: 4, count: 50 },  // 圣保罗
    { lat: -34.6, lng: -58.3, spread: 3, count: 35 },  // 布宜诺斯艾利斯
    { lat: -33.4, lng: -70.6, spread: 3, count: 25 },  // 圣地亚哥
    { lat: -12.0, lng: -77.0, spread: 3, count: 20 },  // 利马
    { lat: 4.7, lng: -74.0, spread: 3, count: 20 },    // 波哥大
    { lat: -22.9, lng: -43.1, spread: 3, count: 30 },  // 里约
    { lat: -0.1, lng: -78.4, spread: 2, count: 10 },   // 基多
    // 填充
    { lat: -15.0, lng: -55.0, spread: 18, count: 40 },
    { lat: -25.0, lng: -60.0, spread: 15, count: 30 },

    // 欧洲（非常密集）
    { lat: 51.5, lng: -0.1, spread: 3, count: 70 },    // 伦敦
    { lat: 48.8, lng: 2.3, spread: 3, count: 60 },     // 巴黎
    { lat: 52.5, lng: 13.4, spread: 3, count: 50 },    // 柏林
    { lat: 50.8, lng: 4.3, spread: 2, count: 20 },     // 布鲁塞尔
    { lat: 52.3, lng: 4.9, spread: 2, count: 25 },     // 阿姆斯特丹
    { lat: 55.6, lng: 12.5, spread: 2, count: 15 },    // 哥本哈根
    { lat: 59.3, lng: 18.0, spread: 2, count: 15 },    // 斯德哥尔摩
    { lat: 60.1, lng: 24.9, spread: 2, count: 12 },    // 赫尔辛基
    { lat: 48.2, lng: 16.3, spread: 2, count: 15 },    // 维也纳
    { lat: 47.4, lng: 19.0, spread: 2, count: 15 },    // 布达佩斯
    { lat: 50.0, lng: 14.4, spread: 2, count: 15 },    // 布拉格
    { lat: 52.2, lng: 21.0, spread: 3, count: 25 },    // 华沙
    { lat: 55.7, lng: 37.6, spread: 4, count: 60 },    // 莫斯科
    { lat: 59.9, lng: 30.3, spread: 3, count: 20 },    // 圣彼得堡
    { lat: 41.9, lng: 12.5, spread: 3, count: 35 },    // 罗马
    { lat: 45.4, lng: 9.1, spread: 3, count: 30 },     // 米兰
    { lat: 40.4, lng: -3.7, spread: 4, count: 35 },    // 马德里
    { lat: 41.3, lng: 2.1, spread: 3, count: 25 },     // 巴塞罗那
    { lat: 38.7, lng: -9.1, spread: 2, count: 15 },    // 里斯本
    { lat: 53.3, lng: -6.2, spread: 2, count: 12 },    // 都柏林
    { lat: 47.3, lng: 11.3, spread: 2, count: 10 },    // 因斯布鲁克
    { lat: 46.9, lng: 7.4, spread: 1, count: 8 },      // 伯尔尼
    // 欧洲填充
    { lat: 50.0, lng: 10.0, spread: 8, count: 50 },
    { lat: 45.0, lng: 15.0, spread: 10, count: 40 },
    { lat: 55.0, lng: -2.0, spread: 6, count: 30 },

    // 非洲
    { lat: -26.2, lng: 28.0, spread: 4, count: 30 },   // 约翰内斯堡
    { lat: -33.9, lng: 18.4, spread: 3, count: 20 },   // 开普敦
    { lat: -1.2, lng: 36.8, spread: 3, count: 20 },    // 内罗毕
    { lat: 6.5, lng: 3.3, spread: 4, count: 40 },      // 拉各斯
    { lat: 30.0, lng: 31.2, spread: 4, count: 35 },    // 开罗
    { lat: 33.8, lng: 35.5, spread: 2, count: 10 },    // 贝鲁特
    { lat: 36.8, lng: 10.1, spread: 3, count: 15 },    // 突尼斯
    { lat: -4.3, lng: 15.3, spread: 3, count: 15 },    // 金沙萨
    { lat: 5.6, lng: -0.1, spread: 3, count: 20 },     // 阿克拉
    // 填充
    { lat: 0.0, lng: 20.0, spread: 15, count: 30 },
    { lat: -20.0, lng: 25.0, spread: 12, count: 20 },

    // 中东
    { lat: 25.2, lng: 55.2, spread: 3, count: 25 },    // 迪拜
    { lat: 24.7, lng: 46.6, spread: 4, count: 20 },    // 利雅得
    { lat: 32.0, lng: 34.8, spread: 2, count: 15 },    // 特拉维夫
    { lat: 39.9, lng: 32.8, spread: 3, count: 20 },    // 安卡拉
    { lat: 41.0, lng: 28.9, spread: 4, count: 30 },    // 伊斯坦布尔
    { lat: 35.6, lng: 51.3, spread: 4, count: 40 },    // 德黑兰
    { lat: 33.3, lng: 44.3, spread: 3, count: 20 },    // 巴格达

    // 印度
    { lat: 19.0, lng: 72.8, spread: 4, count: 50 },    // 孟买
    { lat: 28.6, lng: 77.2, spread: 4, count: 45 },    // 德里
    { lat: 22.5, lng: 88.3, spread: 3, count: 25 },    // 加尔各答
    { lat: 13.0, lng: 80.2, spread: 3, count: 25 },    // 金奈
    { lat: 12.9, lng: 77.5, spread: 3, count: 20 },    // 班加罗尔
    { lat: 17.3, lng: 78.4, spread: 3, count: 20 },    // 海得拉巴
    // 填充
    { lat: 22.0, lng: 78.0, spread: 8, count: 30 },

    // 中国/东亚（非常密集）
    { lat: 39.9, lng: 116.4, spread: 4, count: 80 },   // 北京
    { lat: 31.2, lng: 121.4, spread: 4, count: 70 },   // 上海
    { lat: 22.5, lng: 114.0, spread: 3, count: 50 },   // 深圳/香港
    { lat: 23.1, lng: 113.2, spread: 4, count: 45 },   // 广州
    { lat: 30.5, lng: 114.3, spread: 4, count: 35 },   // 武汉
    { lat: 34.3, lng: 108.9, spread: 4, count: 30 },   // 西安
    { lat: 36.0, lng: 120.3, spread: 3, count: 25 },   // 青岛
    { lat: 38.0, lng: 117.3, spread: 3, count: 25 },   // 天津
    { lat: 32.0, lng: 118.7, spread: 3, count: 25 },   // 南京
    { lat: 30.2, lng: 120.1, spread: 3, count: 20 },   // 杭州
    { lat: 29.5, lng: 106.5, spread: 3, count: 20 },   // 重庆
    { lat: 28.2, lng: 112.9, spread: 3, count: 20 },   // 长沙
    { lat: 26.0, lng: 119.3, spread: 3, count: 15 },   // 福州
    { lat: 24.4, lng: 118.0, spread: 3, count: 15 },   // 厦门
    { lat: 45.7, lng: 126.6, spread: 4, count: 25 },   // 哈尔滨
    { lat: 43.8, lng: 125.3, spread: 3, count: 15 },   // 长春
    { lat: 41.8, lng: 123.4, spread: 3, count: 20 },   // 沈阳
    { lat: 38.9, lng: 121.6, spread: 3, count: 15 },   // 大连
    { lat: 36.6, lng: 101.7, spread: 3, count: 10 },   // 西宁
    { lat: 43.8, lng: 87.6, spread: 3, count: 10 },    // 乌鲁木齐
    // 中国填充
    { lat: 35.0, lng: 110.0, spread: 12, count: 60 },
    { lat: 30.0, lng: 115.0, spread: 10, count: 50 },

    // 日本/韩国
    { lat: 35.6, lng: 139.6, spread: 3, count: 60 },   // 东京
    { lat: 34.6, lng: 135.5, spread: 3, count: 30 },   // 大阪
    { lat: 35.1, lng: 136.9, spread: 2, count: 15 },   // 名古屋
    { lat: 43.0, lng: 141.3, spread: 3, count: 12 },   // 札幌
    { lat: 33.5, lng: 130.4, spread: 2, count: 10 },   // 福冈
    { lat: 37.5, lng: 127.0, spread: 3, count: 45 },   // 首尔
    { lat: 35.1, lng: 129.0, spread: 2, count: 15 },   // 釜山
    // 填充
    { lat: 36.0, lng: 138.0, spread: 6, count: 25 },

    // 东南亚
    { lat: 1.3, lng: 103.8, spread: 3, count: 30 },    // 新加坡
    { lat: 3.1, lng: 101.6, spread: 4, count: 35 },    // 吉隆坡
    { lat: 13.7, lng: 100.5, spread: 4, count: 30 },   // 曼谷
    { lat: 10.7, lng: 106.6, spread: 4, count: 25 },   // 胡志明市
    { lat: 14.5, lng: 121.0, spread: 3, count: 35 },   // 马尼拉
    { lat: 6.2, lng: 106.8, spread: 4, count: 40 },    // 雅加达
    { lat: -6.9, lng: 107.6, spread: 3, count: 20 },   // 万隆
    { lat: -7.2, lng: 112.7, spread: 3, count: 15 },   // 泗水
    { lat: 21.0, lng: 105.8, spread: 3, count: 20 },   // 河内

    // 澳洲
    { lat: -33.8, lng: 151.2, spread: 3, count: 30 },  // 悉尼
    { lat: -37.8, lng: 144.9, spread: 3, count: 25 },  // 墨尔本
    { lat: -27.4, lng: 153.0, spread: 3, count: 15 },  // 布里斯班
    { lat: -31.9, lng: 115.8, spread: 3, count: 12 },  // 珀斯
    { lat: -34.9, lng: 138.6, spread: 2, count: 10 },  // 阿德莱德
    // 填充
    { lat: -30.0, lng: 140.0, spread: 10, count: 15 },
  ];

  let totalCount = 0;
  cityClusters.forEach(c => totalCount += c.count);

  const positions = new Float32Array(totalCount * 3);
  const colors = new Float32Array(totalCount * 3);
  const sizes = new Float32Array(totalCount);

  let idx = 0;
  cityClusters.forEach(cluster => {
    for (let i = 0; i < cluster.count; i++) {
      const lat = cluster.lat + (Math.random() - 0.5) * cluster.spread;
      const lng = cluster.lng + (Math.random() - 0.5) * cluster.spread;
      const r = EARTH_RADIUS + 0.005 + Math.random() * 0.01;

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = r * Math.cos(phi);
      positions[idx * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // 大小变化：有的亮点大，有的小
      sizes[idx] = 0.6 + Math.random() * 1.8;

      // 城市灯光颜色：暖白、黄、橙、冷白
      const t = Math.random();
      if (t < 0.2) {
        // 暖白（大城市）
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.95; colors[idx * 3 + 2] = 0.85;
      } else if (t < 0.45) {
        // 黄色
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.85; colors[idx * 3 + 2] = 0.4;
      } else if (t < 0.7) {
        // 橙色
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.6; colors[idx * 3 + 2] = 0.2;
      } else if (t < 0.88) {
        // 淡黄
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.9; colors[idx * 3 + 2] = 0.5;
      } else {
        // 冷白（偶尔）
        colors[idx * 3] = 0.9; colors[idx * 3 + 1] = 0.95; colors[idx * 3 + 2] = 1.0;
      }

      idx++;
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      varying vec3 vColor;
      void main() {
        vColor = aColor;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(0.8, aSize * (50.0 / -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        // 硬边亮点，无shader光晕
        float alpha = step(dist, 0.35) * 0.85;
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
    color: 0x050a12,
    emissive: 0x050a12,
    emissiveIntensity: 0.05,
    roughness: 0.98,
    metalness: 0.0
  });

  loader.load(nightUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    material.emissiveMap = texture;
    material.emissive.set(0xffffff);
    material.emissiveIntensity = 0.3;
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

export function updateEarth(earthGroup, deltaTime, elapsedTime) {
  const { earth, ROTATION_SPEED: speed } = earthGroup.userData;
  earth.rotation.y += speed;
}
