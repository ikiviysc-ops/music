import * as THREE from 'three';
import { createScene } from './core/scene.js';
import { createCamera, updateCameraAspect } from './core/camera.js';
import { createRenderer, updateRendererSize } from './core/renderer.js';
import { createControls } from './core/controls.js';
import { createEarth, updateEarth } from './modules/earth.js';
// 暂时禁用复杂组件，先确保地球可见
// import { createBeams, updateBeams, updateLabels, updateBeamConfig, setBeamDimensions, getBeamConfig } from './modules/beam.js';
// import { createComposer, updateComposerSize } from './effects/bloom.js';
// import { createParticles, updateParticles } from './modules/particles.js';
// import { createArcs, updateArcs } from './modules/arc.js';
// import { getMusicEngine } from './modules/ambient-music.js';

console.log('=== 地球音乐可视化系统 ===');

class App {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.controls = null;
    this.earthGroup = null;
    this.useComposer = false; // 暂时禁用后处理
  }

  init() {
    console.log('🚀 App.init() called');
    
    this.container = document.getElementById('canvas-container');
    if (!this.container) {
      console.error('❌ canvas-container not found!');
      return;
    }
    console.log('✅ canvas-container found');

    // 确保容器尺寸就绪
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    console.log('✅ Container size:', w, 'x', h);
    if (w === 0 || h === 0) {
      console.error('❌ Container has zero dimensions!');
      return;
    }

    // 场景
    this.scene = createScene();
    console.log('✅ Scene created');

    // 相机
    this.camera = createCamera(this.container);
    console.log('✅ Camera created, position:', this.camera.position);

    // 渲染器
    this.renderer = createRenderer(this.container);
    console.log('✅ Renderer created');

    // 控制器
    this.controls = createControls(this.camera, this.renderer);
    console.log('✅ Controls created');

    // 添加地球 - 最简单的
    this.addEarth();

    console.log('✅ Scene children count:', this.scene.children.length);
    console.log('Scene children:', this.scene.children);

    // 窗口大小变化处理
    window.addEventListener('resize', this.onResize.bind(this));

    // 开始动画
    this.animate();
    
    console.log('=== 初始化完成！===');
    console.log('💡 你应该能看到一个旋转的蓝色地球');
  }

  addEarth() {
    this.earthGroup = createEarth();
    this.scene.add(this.earthGroup);
    console.log('✅ Earth group added to scene');
  }

  onResize() {
    updateCameraAspect(this.camera, this.container);
    updateRendererSize(this.renderer, this.container);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = 0.016; // 固定delta先简化
    const elapsed = performance.now() / 1000;

    if (this.earthGroup) {
      updateEarth(this.earthGroup, delta, elapsed, this.camera);
    }

    this.controls.update();

    // 直接渲染，暂时不用后处理
    this.renderer.render(this.scene, this.camera);
  }
}

// 启动！
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.app = app;
});
