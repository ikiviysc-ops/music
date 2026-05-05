# 3D 地球音乐可视化 - 完整开发规范

## 📋 目录

- [一、项目定位](#一项目定位)
- [二、技术栈](#二技术栈)
- [三、整体视觉哲学](#三整体视觉哲学)
- [四、视觉层级](#四视觉层级)
- [五、配色体系](#五配色体系)
- [六、地球调优](#六地球调优)
- [七、光柱调优](#七光柱调优)
- [八、流动弧线调优](#八流动弧线调优)
- [九、Bloom 效果](#九bloom-效果)
- [十、交互动效](#十交互动效)
- [十一、音频驱动](#十一音频驱动)
- [十二、核心实现代码](#十二核心实现代码)
- [十三、性能优化](#十三性能优化)
- [十四、终极细节](#十四终极细节)

---

## 一、项目定位

本方案目标：实现接近商业级数据可视化效果的3D地球音乐系统，包含 Shader 光柱、粒子流动、Bloom 辉光、动态交互。

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
1. 背景（暗）
2. 地球（主体）
3. 大气光（氛围）
4. 城市点（基础数据）
5. 光柱（核心数据）
6. 流动弧线（动态）
7. UI（信息层）

### 视觉焦点规则
- 同一时间只允许 1~2 个视觉焦点
- 其他必须"让位"（降低亮度 / 暂停动画）

---

## 五、配色体系

### 主色
- 青蓝：#00D1FF
- 紫：#7C3AED

### 辅助色
- 点缀：#00FFA3
- 背景：#050510

### 原则
- 全局不超过 3 种高亮色

---

## 六、地球调优

### 6.1 自转速度
```javascript
earth.rotation.y += 0.0008;
```

**原则：**
- 慢到"几乎感觉不到"
- 但停止后会觉得"少了点东西"

### 6.2 大气光（高级感核心）
**Shader强度：**
```glsl
float intensity = pow(0.8 - dot(vNormal, vec3(0,0,1.0)), 3.0);
```

**调优逻辑：**
- 不要太亮
- 只在边缘出现
- 颜色：#00D1FF（蓝青色）

### 6.3 地球亮度控制
```javascript
material.emissiveIntensity = 0.4;
```

**原因：**
- 地球太亮 → 光柱不突出

---

## 七、光柱调优

### 7.1 高度映射（避免刺眼）
```javascript
height = Math.log(listeners + 1) * 0.8;
```

**⚠️ 不要线性映射！**
- 否则大城市直接炸屏

### 7.2 呼吸动画（灵魂）
```javascript
scale.y = baseHeight + Math.sin(time * 2) * 0.1;
```

**原则：**
- 幅度小：0.05 ~ 0.15
- 不同步：添加随机 phase

### 7.3 渐变透明（必须）
**Shader逻辑：**
```glsl
alpha = smoothstep(0.0, 1.0, vY);
```

- 顶部更亮，底部更淡

### 7.4 顶部能量点（加分项）
- 在光柱顶端加一个小球
- 带 Bloom 效果

**效果：** "数据在发光，而不是一根柱子"

---

## 八、流动弧线调优

### 8.1 曲线高度
```javascript
mid.y += distance * 0.3;
```

**原则：**
- 距离越远 → 弧线越高

### 8.2 粒子流速
```
speed = 0.002 ~ 0.01
```

**分类：**
- 近距离：慢（稳定）
- 远距离：快（活跃）

### 8.3 尾迹长度
**控制方法：**
- 粒子数量
- 或 shader fade

**推荐效果：**
- 头亮尾淡（像流星）

---

## 九、Bloom 效果

### 推荐参数
```javascript
strength: 1.8
radius: 0.6
threshold: 0.25
```

### 调优原则
❌ **错误做法：**
- 全屏发光（廉价感）

✅ **正确做法：**
- 只让以下元素发光：
  - 光柱顶部
  - 粒子
  - 城市点

---

## 十、交互动效

### 10.1 相机飞行（必须丝滑）
```javascript
ease: "power3.inOut"
duration: 1.2 ~ 1.8
```

### 10.2 点击城市（完整流程）
**必须包含：**
1. 光柱放大
2. 相机飞过去
3. UI 弹出

**节奏：** 点击 → 0.2s 高亮 → 1.2s 飞行 → UI 出现

### 10.3 Hover 反馈（细节）
- 光柱轻微变亮
- 粒子速度增加

> **小细节 = 高级感**

---

## 十一、音频驱动

### 控制维度
- 光柱高度（轻微）
- 粒子速度
- Bloom 强度

### 示例代码
```javascript
beam.scale.y += frequency * 0.002;
```

### 注意事项
- 不要剧烈变化
- 否则变成"蹦迪 UI"

---

## 十二、核心实现代码

### 12.1 Shader光柱（渐变+发光）

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    color: { value: new THREE.Color(0x00ffff) }
  },
  vertexShader: `
    varying float vY;
    void main() {
      vY = position.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    varying float vY;
    void main() {
      float alpha = smoothstep(0.0,1.0,vY);
      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true
});
```

### 12.2 粒子流动弧线（高级感关键）

```javascript
const points = curve.getPoints(100);
const geo = new THREE.BufferGeometry().setFromPoints(points);

const mat = new THREE.PointsMaterial({
  size: 0.03,
  color: 0x00ffff
});

const particles = new THREE.Points(geo, mat);
scene.add(particles);
```

### 12.3 Bloom辉光（调优版）

```javascript
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  2.2,
  0.8,
  0.2
);
```

### 12.4 地球大气光（边缘发光）

```javascript
const glowMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vNormal;
    void main(){
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    void main(){
      float intensity = pow(0.6 - dot(vNormal, vec3(0,0,1.0)), 2.0);
      gl_FragColor = vec4(0.0,0.6,1.0,1.0) * intensity;
    }
  `,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true
});
```

### 12.5 相机飞行（点击城市）

```javascript
import gsap from 'gsap';

function flyTo(target){
  gsap.to(camera.position,{
    x: target.x * 2,
    y: target.y * 2,
    z: target.z * 2,
    duration: 1.5
  });
}
```

### 12.6 音频驱动动画（频谱）

```javascript
const analyser = audioContext.createAnalyser();
const dataArray = new Uint8Array(analyser.frequencyBinCount);

function update(){
  analyser.getByteFrequencyData(dataArray);
}
```

---

## 十三、性能优化（必须执行）

1. 使用 InstancedMesh
2. 限制粒子数量
3. 移动端降低分辨率
4. 关闭阴影

---

## 十四、终极细节

### 14.1 动画不同步
```javascript
Math.sin(time + randomOffset)
```
- 避免"机械感"

### 14.2 微延迟（高级感关键）
- 不同城市光柱延迟启动
- 弧线延迟出现

### 14.3 呼吸节奏统一
- 所有动画共享：`globalTime`

---

## 十五、最终效果构成

1. 地球（贴图+大气光）
2. Shader光柱
3. 粒子流动弧线
4. Bloom辉光
5. UI叠加
6. 实时数据
