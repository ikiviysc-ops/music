全球实时听歌3D地球（进阶版｜产品级实现文档）

# 一、项目定位（产品级）

本方案目标：实现接近商业级数据可视化效果的3D地球音乐系统，包含Shader光柱、粒子流动、Bloom辉光、动态交互。

# 二、进阶技术栈

Three\.js \+ WebGL \+ GLSL Shader \+ GSAP \+ EffectComposer \+ UnrealBloomPass \+ CSS2DRenderer

# 三、核心进阶实现

## 1\. Shader光柱（渐变\+发光）

  
const material = new THREE\.ShaderMaterial\(\{  
  uniforms: \{  
    color: \{ value: new THREE\.Color\(0x00ffff\) \}  
  \},  
  vertexShader: \`  
    varying float vY;  
    void main\(\) \{  
      vY = position\.y;  
      gl\_Position = projectionMatrix \* modelViewMatrix \* vec4\(position,1\.0\);  
    \}  
  \`,  
  fragmentShader: \`  
    uniform vec3 color;  
    varying float vY;  
    void main\(\) \{  
      float alpha = smoothstep\(0\.0,1\.0,vY\);  
      gl\_FragColor = vec4\(color, alpha\);  
    \}  
  \`,  
  transparent: true  
\}\);  


## 2\. 粒子流动弧线（高级感关键）

  
const points = curve\.getPoints\(100\);  
const geo = new THREE\.BufferGeometry\(\)\.setFromPoints\(points\);  
  
const mat = new THREE\.PointsMaterial\(\{  
  size: 0\.03,  
  color: 0x00ffff  
\}\);  
  
const particles = new THREE\.Points\(geo, mat\);  
scene\.add\(particles\);  


## 3\. Bloom辉光（调优版）

  
const bloomPass = new UnrealBloomPass\(  
  new THREE\.Vector2\(window\.innerWidth, window\.innerHeight\),  
  2\.2,  
  0\.8,  
  0\.2  
\);  


## 4\. 地球大气光（边缘发光）

  
const glowMaterial = new THREE\.ShaderMaterial\(\{  
  vertexShader: \`  
    varying vec3 vNormal;  
    void main\(\)\{  
      vNormal = normalize\(normalMatrix \* normal\);  
      gl\_Position = projectionMatrix \* modelViewMatrix \* vec4\(position,1\.0\);  
    \}  
  \`,  
  fragmentShader: \`  
    varying vec3 vNormal;  
    void main\(\)\{  
      float intensity = pow\(0\.6 \- dot\(vNormal, vec3\(0,0,1\.0\)\), 2\.0\);  
      gl\_FragColor = vec4\(0\.0,0\.6,1\.0,1\.0\) \* intensity;  
    \}  
  \`,  
  side: THREE\.BackSide,  
  blending: THREE\.AdditiveBlending,  
  transparent: true  
\}\);  


## 5\. 相机飞行（点击城市）

  
import gsap from 'gsap';  
  
function flyTo\(target\)\{  
  gsap\.to\(camera\.position,\{  
    x: target\.x \* 2,  
    y: target\.y \* 2,  
    z: target\.z \* 2,  
    duration: 1\.5  
  \}\);  
\}  


## 6\. 音频驱动动画（频谱）

  
const analyser = audioContext\.createAnalyser\(\);  
const dataArray = new Uint8Array\(analyser\.frequencyBinCount\);  
  
function update\(\)\{  
  analyser\.getByteFrequencyData\(dataArray\);  
\}  


# 四、最终效果构成

1\. 地球（贴图\+大气光）  
2\. Shader光柱  
3\. 粒子流动弧线  
4\. Bloom辉光  
5\. UI叠加  
6\. 实时数据

# 五、性能优化（必须执行）

使用InstancedMesh、限制粒子、移动端降低分辨率、关闭阴影

# 六、AI执行指令（直接复制）

请基于Three\.js构建一个3D地球可视化系统，包含Shader光柱、粒子弧线、Bloom发光、可拖拽控制，并实现移动端适配。

