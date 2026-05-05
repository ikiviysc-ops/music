import * as THREE from 'three';

const EARTH_RADIUS = 2.0;
const ROTATION_SPEED = 0.0004;

function createAtmosphere() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.12, 64, 64);
  
  const atmosphereVertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  const atmosphereFragmentShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec3 viewDirection = normalize(-vPosition);
      float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
      vec3 atmosphereColor = vec3(0.1, 0.4, 0.8);
      float intensity = fresnel * 0.6;
      gl_FragColor = vec4(atmosphereColor, intensity);
    }
  `;
  
  const material = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
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
  
  // 深海背景
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制大陆板块
  const continents = [
    // 北美洲
    { 
      x: 380, y: 200, rx: 180, ry: 200, 
      color: '#1a3d2e',
      details: [
        { x: 280, y: 180, rx: 60, ry: 80 },
        { x: 480, y: 280, rx: 70, ry: 90 },
        { x: 350, y: 350, rx: 40, ry: 50 }
      ]
    },
    // 南美洲
    { 
      x: 520, y: 480, rx: 100, ry: 180, 
      color: '#1e4a35',
      details: [
        { x: 480, y: 420, rx: 50, ry: 60 },
        { x: 560, y: 580, rx: 40, ry: 50 }
      ]
    },
    // 欧洲
    { 
      x: 1050, y: 200, rx: 140, ry: 120, 
      color: '#2a4a3a',
      details: [
        { x: 950, y: 180, rx: 60, ry: 70 },
        { x: 1150, y: 220, rx: 50, ry: 60 }
      ]
    },
    // 非洲
    { 
      x: 1080, y: 450, rx: 150, ry: 200, 
      color: '#224832',
      details: [
        { x: 1000, y: 380, rx: 70, ry: 80 },
        { x: 1150, y: 520, rx: 60, ry: 70 }
      ]
    },
    // 亚洲
    { 
      x: 1400, y: 220, rx: 280, ry: 200, 
      color: '#1f4035',
      details: [
        { x: 1550, y: 280, rx: 80, ry: 100 },
        { x: 1280, y: 180, rx: 100, ry: 120 },
        { x: 1600, y: 350, rx: 70, ry: 90 }
      ]
    },
    // 大洋洲
    { 
      x: 1700, y: 520, rx: 140, ry: 100, 
      color: '#1e4030',
      details: [
        { x: 1780, y: 560, rx: 60, ry: 50 },
        { x: 1640, y: 480, rx: 50, ry: 40 }
      ]
    },
    // 南极洲
    { 
      x: 1024, y: 950, rx: 500, ry: 80, 
      color: '#2a3a3a',
      details: []
    }
  ];
  
  // 绘制大陆主体
  continents.forEach(continent => {
    // 主大陆
    const gradient = ctx.createRadialGradient(
      continent.x, continent.y, 0,
      continent.x, continent.y, continent.rx
    );
    gradient.addColorStop(0, continent.color);
    gradient.addColorStop(0.7, continent.color);
    gradient.addColorStop(1, '#0f2520');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(continent.x, continent.y, continent.rx, continent.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 大陆细节
    continent.details.forEach(detail => {
      const detailGradient = ctx.createRadialGradient(
        detail.x, detail.y, 0,
        detail.x, detail.y, detail.rx
      );
      detailGradient.addColorStop(0, continent.color);
      detailGradient.addColorStop(1, '#0a1a15');
      
      ctx.fillStyle = detailGradient;
      ctx.beginPath();
      ctx.ellipse(detail.x, detail.y, detail.rx, detail.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  
  // 添加海洋纹理
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 1.5 + 0.5;
    const alpha = Math.random() * 0.08 + 0.02;
    ctx.fillStyle = `rgba(20, 60, 100, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 添加城市灯光 - 主要城市
  const cities = [
    // 北美
    { x: 420, y: 240 }, { x: 350, y: 280 }, { x: 380, y: 200 },
    { x: 520, y: 480 }, { x: 480, y: 420 },
    // 欧洲
    { x: 1020, y: 200 }, { x: 1080, y: 220 }, { x: 960, y: 180 },
    { x: 1150, y: 240 }, { x: 1000, y: 260 },
    // 亚洲
    { x: 1450, y: 250 }, { x: 1520, y: 300 }, { x: 1380, y: 220 },
    { x: 1600, y: 280 }, { x: 1350, y: 350 }, { x: 1250, y: 200 },
    // 南美
    { x: 520, y: 520 }, { x: 560, y: 600 },
    // 非洲
    { x: 1080, y: 420 }, { x: 1120, y: 480 },
    // 大洋洲
    { x: 1720, y: 520 }, { x: 1680, y: 480 }
  ];
  
  // 绘制城市灯光
  cities.forEach((city, i) => {
    const size = Math.random() * 3 + 2;
    const brightness = Math.random() * 0.3 + 0.7;
    
    // 城市光晕
    const glowGradient = ctx.createRadialGradient(city.x, city.y, 0, city.x, city.y, size * 15);
    glowGradient.addColorStop(0, `rgba(255, 230, 150, ${brightness * 0.4})`);
    glowGradient.addColorStop(0.5, `rgba(255, 200, 100, ${brightness * 0.2})`);
    glowGradient.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(city.x, city.y, size * 15, 0, Math.PI * 2);
    ctx.fill();
    
    // 城市核心
    const coreGradient = ctx.createRadialGradient(city.x, city.y, 0, city.x, city.y, size);
    coreGradient.addColorStop(0, `rgba(255, 255, 220, ${brightness})`);
    coreGradient.addColorStop(0.5, `rgba(255, 220, 150, ${brightness * 0.8})`);
    coreGradient.addColorStop(1, `rgba(255, 180, 100, 0)`);
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(city.x, city.y, size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // 添加更多分散的城市灯光
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 1.5 + 0.5;
    const alpha = Math.random() * 0.25 + 0.1;
    ctx.fillStyle = `rgba(255, 230, 180, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function createEarth() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
  const texture = createEarthTexture();
  
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: 0x0a1a2e,
    emissiveIntensity: 0.3,
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

export function updateEarth(earthGroup, deltaTime, elapsedTime) {
  const { earth, atmosphere, ROTATION_SPEED: speed } = earthGroup.userData;
  earth.rotation.y += speed;
}
