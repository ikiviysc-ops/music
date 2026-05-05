import * as THREE from 'three';

const EARTH_RADIUS = 2.0;
const ROTATION_SPEED = 0.0003;

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
      float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.5);
      vec3 atmosphereColor = vec3(0.05, 0.2, 0.6);
      float intensity = fresnel * 0.8;
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
  
  // 绘制真实的大陆板块轮廓
  const continents = [
    // 北美洲 - 更真实的形状
    {
      points: [
        [0.15, 0.15], [0.25, 0.12], [0.35, 0.15], [0.38, 0.22],
        [0.35, 0.30], [0.30, 0.35], [0.25, 0.38], [0.20, 0.35],
        [0.15, 0.30], [0.12, 0.25], [0.10, 0.20]
      ],
      color: '#1a3d2e'
    },
    // 南美洲
    {
      points: [
        [0.28, 0.42], [0.32, 0.40], [0.35, 0.45], [0.36, 0.55],
        [0.34, 0.65], [0.30, 0.70], [0.26, 0.68], [0.24, 0.60],
        [0.24, 0.50]
      ],
      color: '#1e4a35'
    },
    // 欧洲
    {
      points: [
        [0.48, 0.18], [0.55, 0.15], [0.58, 0.18], [0.56, 0.25],
        [0.52, 0.28], [0.48, 0.26], [0.46, 0.22]
      ],
      color: '#2a4a3a'
    },
    // 非洲
    {
      points: [
        [0.50, 0.32], [0.56, 0.30], [0.60, 0.35], [0.62, 0.45],
        [0.60, 0.55], [0.56, 0.62], [0.52, 0.60], [0.48, 0.50],
        [0.48, 0.40]
      ],
      color: '#224832'
    },
    // 亚洲
    {
      points: [
        [0.62, 0.15], [0.75, 0.12], [0.85, 0.15], [0.90, 0.22],
        [0.88, 0.32], [0.82, 0.38], [0.75, 0.40], [0.68, 0.38],
        [0.62, 0.32], [0.60, 0.25]
      ],
      color: '#1f4035'
    },
    // 大洋洲
    {
      points: [
        [0.82, 0.50], [0.88, 0.48], [0.92, 0.52], [0.90, 0.58],
        [0.85, 0.60], [0.80, 0.58], [0.78, 0.54]
      ],
      color: '#1e4030'
    },
    // 南极洲
    {
      points: [
        [0.20, 0.88], [0.40, 0.85], [0.60, 0.85], [0.80, 0.88],
        [0.85, 0.92], [0.75, 0.95], [0.50, 0.96], [0.25, 0.95],
        [0.15, 0.92]
      ],
      color: '#2a3a3a'
    }
  ];
  
  // 绘制大陆
  continents.forEach(continent => {
    ctx.fillStyle = continent.color;
    ctx.beginPath();
    
    const firstPoint = continent.points[0];
    ctx.moveTo(firstPoint[0] * canvas.width, firstPoint[1] * canvas.height);
    
    for (let i = 1; i < continent.points.length; i++) {
      const point = continent.points[i];
      ctx.lineTo(point[0] * canvas.width, point[1] * canvas.height);
    }
    
    ctx.closePath();
    ctx.fill();
    
    // 添加边缘发光
    ctx.strokeStyle = 'rgba(100, 150, 120, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  
  // 添加海洋纹理
  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 1.5 + 0.5;
    const alpha = Math.random() * 0.06 + 0.02;
    ctx.fillStyle = `rgba(20, 60, 100, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 添加城市灯光
  const cityLights = [
    // 北美
    [0.20, 0.25], [0.25, 0.22], [0.30, 0.28], [0.28, 0.32],
    // 南美
    [0.30, 0.55], [0.32, 0.60],
    // 欧洲
    [0.52, 0.22], [0.54, 0.20], [0.50, 0.24],
    // 非洲
    [0.55, 0.45], [0.56, 0.50],
    // 亚洲
    [0.70, 0.25], [0.75, 0.28], [0.80, 0.22], [0.72, 0.32],
    [0.68, 0.35], [0.78, 0.30],
    // 大洋洲
    [0.85, 0.55], [0.88, 0.52]
  ];
  
  cityLights.forEach(([x, y]) => {
    const cx = x * canvas.width;
    const cy = y * canvas.height;
    const size = Math.random() * 2 + 1.5;
    
    // 光晕
    const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 8);
    glowGradient.addColorStop(0, 'rgba(255, 230, 150, 0.5)');
    glowGradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.2)');
    glowGradient.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 8, 0, Math.PI * 2);
    ctx.fill();
    
    // 核心
    ctx.fillStyle = 'rgba(255, 255, 220, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // 添加更多分散的小灯光
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 1 + 0.3;
    const alpha = Math.random() * 0.3 + 0.1;
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
