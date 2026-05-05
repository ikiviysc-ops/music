# 3D 地球音乐可视化 - 完整开发规范

## 📋 目录

- [一、项目定位](#一项目定位)
- [二、技术栈](#二技术栈)
- [三、整体视觉哲学](#三整体视觉哲学)
- [四、视觉层级](#四视觉层级)
- [五、配色体系](#五配色体系)
- [六、移动端适配（核心重点）](#六移动端适配核心重点)
- [七、页面布局结构](#七页面布局结构)
- [八、地球调优](#八地球调优)
- [九、光柱调优](#九光柱调优)
- [十、流动弧线调优](#十流动弧线调优)
- [十一、Bloom 效果](#十一bloom-效果)
- [十二、交互动效](#十二交互动效)
- [十三、音频驱动](#十三音频驱动)
- [十四、UI组件规范](#十四ui组件规范)
- [十五、核心实现代码](#十五核心实现代码)
- [十六、性能优化](#十六性能优化)
- [十七、终极细节](#十七终极细节)

---

## 一、项目定位

本方案目标：实现接近商业级数据可视化效果的 **移动端优先** 3D 地球音乐系统，包含 Shader 光柱、粒子流动、Bloom 辉光、动态交互、完整 UI 层。

**参考标准：Apple / Spotify 可视化设计水平**

---

## 二、技术栈

```
Three.js + WebGL + GLSL Shader + GSAP + EffectComposer + UnrealBloomPass + CSS2DRenderer
```

---

## 三、整体视觉哲学

### 核心目标
UI要达到的不是"炫"，而是：

> **克制的科技感 + 有呼吸的动效 + 有主次的视觉层级**

### 核心关键词
- 主体突出（地球）
- 数据有生命（光柱 / 粒子）
- 动效有节奏（不是乱动）

---

## 四、视觉层级

### 层级结构（由上到下）
1. 背景（暗） - #050510
2. 地球（主体） - 夜景贴图 + 城市灯光
3. 大气光（氛围） - Fresnel 边缘光
4. 城市点（基础数据） - 小圆点标记
5. 光柱（核心数据） - 多色渐变 Shader
6. 流动弧线（动态） - 粒子流动
7. UI 叠加层（信息层） - HTML/CSS 覆盖在 Canvas 之上

### 视觉焦点规则
- 同一时间只允许 1~2 个视觉焦点
- 其他必须"让位"（降低亮度 / 暂停动画）

---

## 五、配色体系

### 主色
| 颜色 | 色值 | 用途 |
|---|---|---|
| 青蓝 | #00D1FF | 默认光柱、主要数据 |
| 紫 | #7C3AED | 次要数据、强调 |

### 辅助色（多色光柱系统）
| 颜色 | 色值 | 用途 |
|---|---|---|
| 粉红 | #FF6B9D | 洛杉矶等美洲城市 |
| 橙色 | #FF9F43 | 开普敦等非洲城市 |
| 绿色 | #00FFA3 | 圣保罗等南美城市 |
| 金色 | #FFD700 | 新加坡等东南亚城市 |

### 背景 & 文字
| 元素 | 色值 |
|---|---|
| 主背景 | #050510 |
| 卡片背景 | rgba(255,255,255,0.08) |
| 主文字 | #FFFFFF |
| 次文字 | rgba(255,255,255,0.6) |
| 高亮文字 | #00D1FF / #7C3AED |

### 原则
- 全局不超过 **5 种高亮色**
- 同一区域不超过 **3 种颜色**

---

## 六、移动端适配（核心重点）

> ⚠️ 本项目以 **移动端竖屏** 为首要设计目标，PC端为增强体验

### 6.1 设备断点策略

```javascript
const breakpoints = {
  mobile: { max: 480 },      // 手机竖屏（主目标）
  tablet: { max: 768 },      // 平板/手机横屏
  desktop: { min: 769 }      // PC端
};
```

### 6.2 Canvas 尺寸适配

```javascript
// 移动端限制 pixelRatio，避免性能问题
function getPixelRatio() {
  const isMobile = window.innerWidth <= 480;
  return isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2);
}

renderer.setPixelRatio(getPixelRatio());
```

### 6.3 相机参数适配

```javascript
// 根据屏幕宽度调整相机参数
function updateCameraForDevice() {
  const width = window.innerWidth;
  
  if (width <= 480) {
    camera.fov = 60;           // 手机用更宽视野
    camera.position.z = 12;    // 更近的距离
    earth.scale.set(1, 1, 1); // 地球稍大
  } else if (width <= 768) {
    camera.fov = 50;
    camera.position.z = 14;
    earth.scale.set(0.9, 0.9, 0.9);
  } else {
    camera.fov = 45;          // PC默认
    camera.position.z = 15;
    earth.scale.set(0.85, 0.85, 0.85);
  }
}
```

### 6.4 触摸交互 vs 鼠标交互

```javascript
// 区分触摸和鼠标事件
const isTouch = 'ontouchstart' in window;

// 触摸端配置
if (isTouch) {
  controls.rotateSpeed = 0.8;     // 旋转速度适中
  controls.zoomSpeed = 0.8;       // 缩放速度适中
  controls.enablePan = false;     // 禁止平移（手机上容易误触）
  
  // 点击检测使用 touchend
  canvas.addEventListener('touchend', onTouchEnd);
} else {
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 1.2;
  controls.enablePan = true;
  
  canvas.addEventListener('click', onClick);
}
```

### 6.5 UI 层响应式布局

```css
/* 移动端基础样式 */
.ui-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none; /* 让点击穿透到Canvas */
  z-index: 10;
}

/* 可交互的UI元素需要恢复pointer-events */
.interactive-ui {
  pointer-events: auto;
}

/* 底部导航栏固定高度 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px; /* 安全区域适配 */
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 6.6 安全区域适配（iPhone刘海屏）

```css
/* iOS安全区域 */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 状态栏区域 */
.header-bar {
  padding-top: max(12px, env(safe-area-inset-top));
}
```

### 6.7 性能降级策略

```javascript
// 根据设备能力动态调整质量
function detectPerformanceLevel() {
  const isMobile = window.innerWidth <= 480;
  const isLowEnd = navigator.hardwareConcurrency < 4 || 
                   navigator.deviceMemory < 4;
  
  return {
    particleCount: isLowEnd ? 200 : (isMobile ? 500 : 1000),
    bloomEnabled: !isLowEnd,
    shadowMap: false,
    antialias: !isMobile,
    arcCount: isLowEnd ? 5 : (isMobile ? 15 : 30),
  };
}
```

---

## 七、页面布局结构

### 整体分层架构

```
┌─────────────────────────────┐
│  Layer 0: Three.js Canvas   │  ← z-index: 1
│  （3D场景：地球+光柱+粒子）  │
├─────────────────────────────┤
│  Layer 1: HTML UI Overlay   │  ← z-index: 10
│                             │
│  ┌─ Header ───────────────┐ │
│  │ 标题 + 搜索 + 头像      │ │
│  ├────────────────────────┤ │
│  │                        │ │
│  │   3D Earth 区域        │ │  ← 占60-70%视口
│  │   （城市标签浮动）       │ │
│  │                        │ │
│  ├─ Song List Card ──────┤ │
│  │ 歌曲列表                │ │
│  ├─ Trend Card ──────────┤ │
│  │ 热度趋势 + 点阵地图     │ │
│  ├─ Player Bar ──────────┤ │
│  │ 当前播放               │ │
│  ├─ Bottom Nav ──────────┤ │
│  │ 导航栏                  │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

### 各区域尺寸规范（移动端）

| 区域 | 高度 | 定位 |
|---|---|---|
| Header | ~80px | fixed top |
| 3D地球区 | calc(100vh - 380px) | relative |
| 歌曲列表卡 | ~220px | scrollable |
| 热度趋势卡 | ~160px | fixed |
| 播放器栏 | ~70px | fixed bottom(60px) |
| 底部导航 | 60px (+ safe area) | fixed bottom |

---

## 八、地球调优

### 8.1 自转速度
```javascript
earth.rotation.y += 0.0008;
```
**原则：** 慢到"几乎感觉不到"，但停止后会觉得"少了点东西"

### 8.2 大气光（高级感核心）
```glsl
float intensity = pow(0.8 - dot(vNormal, vec3(0,0,1.0)), 3.0);
```
**调优逻辑：**
- 不要太亮
- 只在边缘出现
- 颜色：#00D1FF（蓝青色）

### 8.3 地球亮度控制
```javascript
material.emissiveIntensity = 0.4;
```
**原因：** 地球太亮 → 光柱不突出

### 8.4 夜景贴图要求
- 使用高分辨率地球夜景图（至少2048x1024）
- 显示城市灯光分布
- 贴图格式：推荐 JPEG（体积小）或 WebP

---

## 九、光柱调优

### 9.1 高度映射（避免刺眼）
```javascript
height = Math.log(listeners + 1) * 0.8;
```
**⚠️ 不要线性映射！** 否则大城市直接炸屏

### 9.2 多色光柱系统（参考图关键特征）

```javascript
// 根据城市所在区域分配颜色
function getCityColor(city) {
  const colorMap = {
    americas:  { base: '#FF6B9D', glow: '#FF6B9D' },  // 粉红
    europe:   { base: '#00D1FF', glow: '#00D1FF' },  // 青蓝
    asia:     { base: '#7C3AED', glow: '#7C3AED' },  // 紫色
    africa:   { base: '#FF9F43', glow: '#FF9F43' },  // 橙色
    oceania:  { base: '#00FFA3', glow: '#00FFA3' },  // 绿色
  };
  return colorMap[city.region] || colorMap.asia;
}
```

### 9.3 呼吸动画（灵魂）
```javascript
scale.y = baseHeight + Math.sin(time * 2 + randomPhase) * 0.1;
```
**原则：**
- 幅度小：0.05 ~ 0.15
- 不同步：添加随机 phase（每个城市不同）

### 9.4 渐变透明（必须）
```glsl
alpha = smoothstep(0.0, 1.0, vY);
```
- 顶部更亮，底部更淡

### 9.5 顶部能量点（加分项）
- 在光柱顶端加一个小球（半径约0.08）
- 带 Bloom 发光效果
- 颜色与光柱一致

**效果：** "数据在发光，而不是一根柱子"

---

## 十、流动弧线调优

### 10.1 曲线高度
```javascript
mid.y += distance * 0.3;
```
**原则：** 距离越远 → 弧线越高

### 10.2 粒子流速
```
speed = 0.002 ~ 0.01
```
**分类：**
- 近距离：慢（稳定）
- 远距离：快（活跃）

### 10.3 尾迹长度
**控制方法：** 粒子数量 或 shader fade
**推荐效果：** 头亮尾淡（像流星）

### 10.4 弧线数量控制（性能）
```javascript
// 移动端减少弧线数量
const maxArcs = isMobile ? 15 : 30;
// 只显示听众数最高的城市对之间的连接
```

---

## 十一、Bloom 效果

### 推荐参数
```javascript
strength: 1.8
radius: 0.6
threshold: 0.25
```

### 移动端降级
```javascript
// 低端设备禁用或降低Bloom
if (isLowEndDevice) {
  bloomPass.strength = 0.8;
  bloomPass.radius = 0.4;
} else if (isMobile) {
  bloomPass.strength = 1.2;  // 移动端适度降低
}
```

### 调优原则
❌ **错误做法：** 全屏发光（廉价感）
✅ **正确做法：** 只让以下元素发光：
- 光柱顶部能量点
- 粒子弧线头部
- 城市点标记

---

## 十二、交互动效

### 12.1 相机飞行（必须丝滑）
```javascript
ease: "power3.inOut"
duration: 1.2 ~ 1.8
```

### 12.2 点击城市（完整流程）
**必须包含：**
1. 光柱放大（0.2s）
2. 相机飞过去（1.2s）
3. UI 信息卡片弹出（0.3s ease-out）

**节奏：** 点击 → 0.2s 高亮 → 1.2s 飞行 → UI 出现

### 12.3 Hover 反馈（仅桌面端）
- 光柱轻微变亮
- 粒子速度增加
> **小细节 = 高级感**

### 12.4 触摸反馈（移动端替代Hover）
```javascript
// 长按显示详情（代替hover）
let longPressTimer;
canvas.addEventListener('touchstart', (e) => {
  longPressTimer = setTimeout(() => showCityDetail(e), 500);
});
canvas.addEventListener('touchend', () => clearTimeout(longPressTimer));

// 双指缩放地球
canvas.addEventListener('gesturechange', (e) => {
  e.preventDefault();
  camera.position.z *= e.scale;
});
```

---

## 十三、音频驱动

### 控制维度
- 光柱高度（轻微波动）
- 粒子速度
- Bloom 强度微调

### 示例代码
```javascript
beam.scale.y += frequency * 0.002;
```

### 注意事项
- 不要剧烈变化 → 否则变成"蹦迪 UI"
- 使用低通滤波平滑频率数据

---

## 十四、UI组件规范

### 14.1 Header（标题栏）

```
位置：fixed top, z-index: 20
高度：~80px（含安全区域）
内容：
  左侧："全球正在一起听"（大字粗体）+ 波形图标🎵
  下方副标题："此刻，世界各地都在听相同的旋律"（小字灰色）
  右侧：搜索图标(⚙) + 用户头像(圆形)
背景：透明渐变（从上往下 fade 到透明）
```

### 14.2 城市标签卡片（浮动在地球上）

```
样式：圆角矩形卡片
背景：rgba(255,255,255,0.1) + backdrop-filter blur(10px)
边框：1px solid rgba(255,255,255,0.15)
圆角：12px
内边距：8px 12px
内容：
  左侧：城市小图标/封面(32x32)
  中间：
    城市名（白色粗体 14px）
    "XX,XXX人在听"（浅色 12px）
定位：使用 CSS2DRenderer 将3D坐标投影到2D屏幕位置
最大显示数量：移动端 ≤ 6 个（避免拥挤）
```

### 14.3 歌曲列表卡片

```
位置：滚动区域内
背景：rgba(255,255,255,0.06) + 圆角16px
标题行：
  左："全球正在听的歌曲" + 波形图标
  右："查看全部 >"（可点击）
歌曲条目（每行）：
  排名数字(紫色粗体) | 封面(40x40圆角) | 歌名+艺人 | 听歌人数
  底部：细进度条（颜色对应排名：1紫2粉3蓝...）
最多显示：3-5首，其余"查看全部"
```

### 14.4 热度趋势卡片

```
位置：歌曲列表下方
内容：
  标题："全球听歌热度"
  状态："正在上升 📈" + "+12.6%"（绿色/红色根据涨跌）
  时间："较过去1小时"
  背景：世界地图热力点阵（CSS/SVG实现，非3D）
点阵风格：
  使用 div grid 或 SVG circle
  密度和颜色表示热度
  主色调：#7C3AED（紫色系）
```

### 14.5 底部播放器栏

```
位置：fixed, bottom: 60px(导航栏上方)
高度：70px
背景：rgba(20,20,35,0.95) + 上边框分隔线
内容：
  左：当前歌曲封面(48x48圆角)
  中：歌名 + 艺人名（单行截断省略号）
  右：播放控制按钮组
    ⏮ 上一首 | ⏸ 暂停(大圆形) | ⏭ 下一首 | 📋 列表
播放按钮：
  暂停按钮：直径44px，圆形，半透明白色背景
  图标大小：20px
```

### 14.6 底部导航栏

```
位置：fixed bottom: 0
高度：60px + env(safe-area-inset-bottom)
背景：rgba(10,10,20,0.98)
Tab项（5个均分）：
  图标(24px) + 文字(11px)
  激活态：图标+文字变为主题色(#7C3AED)
  Tab名称：首页 | 发现 | 电台 | 收藏 | 我的
首页tab激活时显示地球页面
```

### 14.7 功能按钮（地球右侧浮动）

```
位置：右侧中间，垂直排列
样式：圆形按钮，直径44px
背景：rgba(255,255,255,0.1) + backdrop-filter
图标：
  🌐 地球旋转开关
  🎯 定位到我的城市
间距：按钮之间 12px
```

---

## 十五、核心实现代码

### 15.1 Shader光柱（渐变+发光）

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color(0x00ffff) },
    uTime: { value: 0 },
    uOpacity: { value: 1.0 }
  },
  vertexShader: `
    varying float vY;
    varying vec3 vPosition;
    void main() {
      vY = position.y;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uOpacity;
    varying float vY;
    
    void main() {
      float alpha = smoothstep(0.0, 1.0, vY);
      float pulse = 0.9 + sin(uTime * 2.0) * 0.1;
      gl_FragColor = vec4(uColor * pulse, alpha * uOpacity);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
```

### 15.2 粒子流动弧线

```javascript
const points = curve.getPoints(isMobile ? 60 : 100);
const geo = new THREE.BufferGeometry().setFromPoints(points);

const mat = new THREE.PointsMaterial({
  size: isMobile ? 0.04 : 0.03,
  color: 0x00ffff,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const particles = new THREE.Points(geo, mat);
scene.add(particles);
```

### 15.3 Bloom辉光

```javascript
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.8,   // strength
  0.6,   // radius
  0.25   // threshold
);
composer.addPass(bloomPass);
```

### 15.4 地球大气光（Fresnel边缘光）

```javascript
const glowMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vNormal;
    void main(){
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    void main(){
      float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
      vec3 glowColor = vec3(0.0, 0.82, 1.0); // #00D1FF
      gl_FragColor = vec4(glowColor, intensity * 0.6);
    }
  `,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false
});

const glowMesh = new THREE.Mesh(
  new THREE.SphereGeometry(earthRadius * 1.15, 64, 64),
  glowMaterial
);
scene.add(glowMesh);
```

### 15.5 相机飞行（GSAP）

```javascript
import gsap from 'gsap';

function flyToCity(targetPosition, cityData) {
  return new Promise((resolve) => {
    const targetPos = targetPosition.clone().normalize().multiplyScalar(8);
    
    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.2,
      ease: 'power3.inOut',
      onUpdate: () => camera.lookAt(0, 0, 0),
      onComplete: resolve
    });
  });
}
```

### 15.6 音频分析器

```javascript
class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
  }
  
  init() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }
  
  getFrequency() {
    if (!this.analyser) return 0;
    this.analyser.getByteFrequencyData(this.dataArray);
    const avg = this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length;
    return avg / 255; // 归一化 0-1
  }
}
```

### 15.7 CSS2DRenderer（城市标签投影）

```javascript
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

function createCityLabel(cityData) {
  const div = document.createElement('div');
  div.className = 'city-label';
  div.innerHTML = `
    <div class="city-icon"><img src="${cityData.icon}" /></div>
    <div class="city-info">
      <div class="city-name">${cityData.name}</div>
      <div class="city-listeners">${cityData.listeners.toLocaleString()}人在听</div>
    </div>
  `;
  
  const label = new CSS2DObject(div);
  label.position.copy(cityData.position);
  label.position.y += cityData.beamHeight + 0.3;
  return label;
}
```

---

## 十六、性能优化（必须执行）

### 16.1 渲染层优化
- ✅ 使用 InstancedMesh 批量渲染光柱
- ✅ 粒子数量动态调整（移动端≤500）
- ✅ renderer.pixelRatio 限制（移动端≤1.5，PC≤2）
- ✅ 禁用阴影（shadowMap = false）
- ✅ 减少不必要的 draw call

### 16.2 几何体优化
- ✅ 地球球体分段：移动端 48x32，PC端 64x64
- ✅ 光柱几何体复用（同一 geometry + InstancedMesh）
- ✅ 弧线曲线采样点：移动端 60，PC端 100+

### 16.3 后处理优化
- ✅ 低端设备禁用 Bloom 或降低强度
- ✅ EffectComposer renderTarget 缩放（移动端 0.75x）
- ✅ 只在需要时更新后处理（不是每帧）

### 16.4 内存管理
- ✅ 贴图压缩（使用 compressed textures）
- ✅ 不再可见的对象及时 dispose
- ✅ 粒子系统对象池复用

### 16.5 帧率保障
- 目标：**移动端 ≥ 30fps，PC端 ≥ 60fps**
- 使用 `requestAnimationFrame` 控制渲染节奏
- 可选：`renderer.info` 监控 draw call 数量

---

## 十七、终极细节

### 17.1 动画不同步
```javascript
Math.sin(time + randomOffset)
```
→ 避免"机械感"

### 17.2 微延迟（高级感关键）
- 不同城市光柱延迟启动（stagger 50~200ms）
- 弧线延迟出现（stagger 100~300ms）
- UI卡片依次淡入（stagger 100ms）

### 17.3 呼吸节奏统一
- 所有动画共享全局时间：`globalTime`
- 统一呼吸频率：约 0.5Hz（每2秒一个周期）

### 17.4 加载体验
- 地球贴图先显示低分辨率占位，再加载高清版
- 光柱依次升起（stagger动画）
- 加载完成前显示品牌Logo或骨架屏
- 总加载时间控制在 **3秒以内**

### 17.5 无障碍考虑
- 所有交互元素支持键盘操作（PC端）
- 触摸目标最小尺寸 44x44px（移动端）
- 颜色对比度符合 WCAG AA 标准
