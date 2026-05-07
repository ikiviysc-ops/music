import * as THREE from 'three';

const CONFIG = {
  antialias: true,
  pixelRatio: 2
};

let isWebGLAvailable = false;

export function checkWebGL() {
  return isWebGLAvailable;
}

export function createRenderer(container) {
  console.log('[Renderer] Checking WebGL support...');
  
  // 先检测 WebGL
  const testCanvas = document.createElement('canvas');
  let gl = null;
  try {
    gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
  } catch (e) {
    console.warn('[Renderer] WebGL context creation threw:', e);
  }
  
  if (gl) {
    isWebGLAvailable = true;
    console.log('[Renderer] ✅ WebGL is available!');
  } else {
    isWebGLAvailable = false;
    console.warn('[Renderer] ❌ WebGL is NOT available, will use Canvas 2D fallback');
  }
  
  const pixelRatio = Math.min(window.devicePixelRatio, CONFIG.pixelRatio);

  if (isWebGLAvailable) {
    // WebGL 可用 - 使用 Three.js 正常渲染
    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: CONFIG.antialias,
        alpha: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false
      });
    } catch (e) {
      console.error('[Renderer] WebGLRenderer failed:', e);
      isWebGLAvailable = false;
    }

    if (renderer) {
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(pixelRatio);
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.shadowMap.enabled = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
      console.log('[Renderer] ✅ WebGLRenderer created');
      return renderer;
    }
  }

  // WebGL 不可用 - 创建 Canvas 2D 降级渲染器
  console.log('[Renderer] Creating Canvas 2D fallback renderer...');
  return createFallbackRenderer(container);
}

function createFallbackRenderer(container) {
  const canvas = document.createElement('canvas');
  canvas.width = container.clientWidth * Math.min(window.devicePixelRatio, 2);
  canvas.height = container.clientHeight * Math.min(window.devicePixelRatio, 2);
  canvas.style.width = container.clientWidth + 'px';
  canvas.style.height = container.clientHeight + 'px';
  canvas.style.display = 'block';
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  
  // 创建一个模拟 Three.js 渲染器的对象
  const fallbackRenderer = {
    domElement: canvas,
    _canvas: canvas,
    _ctx: ctx,
    _isFallback: true,
    _scene: null,
    _camera: null,
    
    setSize(w, h) {
      const pr = Math.min(window.devicePixelRatio, 2);
      canvas.width = w * pr;
      canvas.height = h * pr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    },
    
    setPixelRatio(pr) {
      // handled in setSize
    },
    
    render(scene, camera) {
      renderFallbackScene(ctx, canvas, scene, camera);
    },
    
    get outputColorSpace() { return THREE.SRGBColorSpace; },
    set outputColorSpace(v) {},
    get toneMapping() { return THREE.NoToneMapping; },
    set toneMapping(v) {},
    get shadowMap() { return { enabled: false }; }
  };
  
  console.log('[Renderer] ✅ Canvas 2D fallback renderer created');
  return fallbackRenderer;
}

function renderFallbackScene(ctx, canvas, scene, camera) {
  const w = canvas.width;
  const h = canvas.height;
  
  // 清空画布
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);
  
  // 中心点
  const cx = w / 2;
  const cy = h / 2;
  
  // 计算地球在屏幕上的大小
  const fov = camera.fov || 45;
  const dist = camera.position ? camera.position.z : 5;
  const earthRadius = 1.6;
  const screenRadius = (earthRadius / dist) * (h / (2 * Math.tan(fov * Math.PI / 360)));
  
  // 绘制大气层光晕
  const glowGrad = ctx.createRadialGradient(cx, cy, screenRadius * 0.8, cx, cy, screenRadius * 1.4);
  glowGrad.addColorStop(0, 'rgba(68, 136, 255, 0.08)');
  glowGrad.addColorStop(0.5, 'rgba(68, 136, 255, 0.04)');
  glowGrad.addColorStop(1, 'rgba(68, 136, 255, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, w, h);
  
  // 绘制地球
  const earthGrad = ctx.createRadialGradient(
    cx - screenRadius * 0.3, cy - screenRadius * 0.3, screenRadius * 0.1,
    cx, cy, screenRadius
  );
  earthGrad.addColorStop(0, '#2a5a8c');
  earthGrad.addColorStop(0.4, '#1a3a5c');
  earthGrad.addColorStop(0.8, '#0f2240');
  earthGrad.addColorStop(1, '#0a1830');
  
  ctx.beginPath();
  ctx.arc(cx, cy, screenRadius, 0, Math.PI * 2);
  ctx.fillStyle = earthGrad;
  ctx.fill();
  
  // 绘制边缘大气光
  const atmoGrad = ctx.createRadialGradient(cx, cy, screenRadius * 0.92, cx, cy, screenRadius * 1.08);
  atmoGrad.addColorStop(0, 'rgba(68, 136, 255, 0)');
  atmoGrad.addColorStop(0.5, 'rgba(68, 136, 255, 0.15)');
  atmoGrad.addColorStop(1, 'rgba(68, 136, 255, 0)');
  ctx.beginPath();
  ctx.arc(cx, cy, screenRadius * 1.08, 0, Math.PI * 2);
  ctx.fillStyle = atmoGrad;
  ctx.fill();
  
  // 绘制经纬线
  const time = Date.now() / 1000;
  const rotOffset = time * 0.1;
  
  ctx.strokeStyle = 'rgba(100, 180, 255, 0.08)';
  ctx.lineWidth = 1;
  
  // 纬线
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = cy + (lat / 90) * screenRadius * 0.9;
    const latRadius = screenRadius * Math.cos(lat * Math.PI / 180) * 0.9;
    if (latRadius > 0) {
      ctx.beginPath();
      ctx.ellipse(cx, y, latRadius, latRadius * 0.15, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  // 经线
  for (let lng = 0; lng < 180; lng += 30) {
    const angle = (lng + rotOffset * 30) * Math.PI / 180;
    const xOff = Math.sin(angle) * screenRadius * 0.9;
    ctx.beginPath();
    ctx.ellipse(cx + xOff * 0.3, cy, Math.abs(Math.cos(angle)) * screenRadius * 0.3 + 2, screenRadius * 0.9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // 绘制城市光点
  const cities = [
    { lat: 35.6, lng: 139.6, name: '东京', size: 4 },
    { lat: 40.7, lng: -74.0, name: '纽约', size: 3.5 },
    { lat: 51.5, lng: -0.1, name: '伦敦', size: 3 },
    { lat: 48.9, lng: 2.35, name: '巴黎', size: 2.5 },
    { lat: -33.9, lng: 151.2, name: '悉尼', size: 2.5 },
    { lat: 55.75, lng: 37.6, name: '莫斯科', size: 2.5 },
    { lat: 22.3, lng: 114.2, name: '香港', size: 3 },
    { lat: 1.35, lng: 103.8, name: '新加坡', size: 2.5 },
    { lat: -23.5, lng: -46.6, name: '圣保罗', size: 2.5 },
    { lat: 37.6, lng: 127.0, name: '首尔', size: 2.5 },
    { lat: 19.4, lng: -99.1, name: '墨西哥城', size: 2 },
    { lat: 28.6, lng: 77.2, name: '新德里', size: 2.5 },
    { lat: 31.2, lng: 121.5, name: '上海', size: 3 },
    { lat: 39.9, lng: 116.4, name: '北京', size: 3 },
    { lat: 34.1, lng: -118.2, name: '洛杉矶', size: 2.5 },
  ];
  
  cities.forEach(city => {
    const phi = (90 - city.lat) * Math.PI / 180;
    const theta = (city.lng + rotOffset * 30) * Math.PI / 180;
    
    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.cos(phi);
    const z = Math.sin(phi) * Math.sin(theta);
    
    // 只绘制面向相机的点（z > 0）
    if (z > -0.2) {
      const sx = cx + x * screenRadius * 0.9;
      const sy = cy - y * screenRadius * 0.9;
      const brightness = Math.max(0.3, (z + 0.2) / 1.2);
      
      // 城市光点
      const dotGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, city.size * brightness * 3);
      dotGrad.addColorStop(0, `rgba(255, 200, 100, ${brightness * 0.9})`);
      dotGrad.addColorStop(0.5, `rgba(255, 150, 50, ${brightness * 0.4})`);
      dotGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = dotGrad;
      ctx.fillRect(sx - city.size * 4, sy - city.size * 4, city.size * 8, city.size * 8);
      
      // 光柱
      const beamHeight = city.size * 12 * brightness;
      const beamGrad = ctx.createLinearGradient(sx, sy, sx, sy - beamHeight);
      beamGrad.addColorStop(0, `rgba(124, 58, 237, ${brightness * 0.6})`);
      beamGrad.addColorStop(0.3, `rgba(0, 209, 255, ${brightness * 0.4})`);
      beamGrad.addColorStop(1, 'rgba(0, 209, 255, 0)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(sx - 1.5, sy - beamHeight, 3, beamHeight);
    }
  });
  
  // 绘制粒子
  for (let i = 0; i < 50; i++) {
    const px = (Math.sin(time * 0.3 + i * 7.3) * 0.5 + 0.5) * w;
    const py = (Math.cos(time * 0.2 + i * 5.7) * 0.5 + 0.5) * h;
    const alpha = Math.sin(time + i * 2.1) * 0.3 + 0.3;
    ctx.fillStyle = `rgba(100, 180, 255, ${alpha})`;
    ctx.fillRect(px, py, 1.5, 1.5);
  }
}

export function updateRendererSize(renderer, container) {
  const w = container.clientWidth;
  const h = container.clientHeight;
  
  if (renderer._isFallback) {
    renderer.setSize(w, h);
  } else {
    const pixelRatio = Math.min(window.devicePixelRatio, CONFIG.pixelRatio);
    renderer.setSize(w, h);
    renderer.setPixelRatio(pixelRatio);
  }
}
