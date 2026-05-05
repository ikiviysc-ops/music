import * as THREE from 'three';
import { createScene } from './core/scene.js';
import { createCamera, updateCameraAspect } from './core/camera.js';
import { createRenderer, updateRendererSize } from './core/renderer.js';
import { createControls } from './core/controls.js';
import { createEarth, updateEarth, setEarthMode, getCurrentEarthMode, getAvailableEarthModes, EARTH_MODES } from './modules/earth.js';
import { createComposer, updateComposerSize } from './effects/bloom.js';

class App {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.controls = null;
    this.earthGroup = null;
    this.clock = new THREE.Clock();
    this.useComposer = true;
  }

  init() {
    this.container = document.getElementById('canvas-container');
    if (!this.container) {
      console.error('canvas-container not found');
      return;
    }

    // 确保容器尺寸就绪
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    console.log('Container size:', w, 'x', h);
    if (w === 0 || h === 0) {
      console.error('Container has zero dimensions!');
      return;
    }

    this.scene = createScene();
    this.camera = createCamera(this.container);
    this.renderer = createRenderer(this.container);

    try {
      this.composer = createComposer(this.renderer, this.scene, this.camera);
      this.useComposer = true;
    } catch (e) {
      console.error('EffectComposer failed, falling back to direct render:', e);
      this.useComposer = false;
    }

    this.controls = createControls(this.camera, this.renderer);

    this.addLights();
    this.addEarth();

    console.log('Scene children:', this.scene.children.length);
    console.log('Camera position:', this.camera.position);
    console.log('Earth group:', this.earthGroup);

    window.addEventListener('resize', this.onResize.bind(this));
    
    // 立即强制更新一次尺寸，确保刷新后也清晰
    setTimeout(() => {
      this.onResize();
    }, 50);
    
    this.animate();
  }

  addLights() {
    const ambientLight = new THREE.AmbientLight(0x445566, 1.2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4488ff, 0.8, 50);
    pointLight.position.set(-5, 2, -5);
    this.scene.add(pointLight);

    const backLight = new THREE.DirectionalLight(0x223344, 0.5);
    backLight.position.set(-3, -2, -5);
    this.scene.add(backLight);
  }

  addEarth() {
    this.earthGroup = createEarth();
    this.scene.add(this.earthGroup);
  }

  onResize() {
    updateCameraAspect(this.camera, this.container);
    updateRendererSize(this.renderer, this.container);
    if (this.useComposer && this.composer) {
      updateComposerSize(this.composer, this.container, this.renderer);
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    if (this.earthGroup) {
      updateEarth(this.earthGroup, delta, elapsed, this.camera);
    }

    this.controls.update();

    if (this.useComposer && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  // 地球模式切换
  setEarthMode(mode) {
    if (this.earthGroup) {
      setEarthMode(this.earthGroup, mode);
    }
  }
  
  getEarthMode() {
    return getCurrentEarthMode();
  }
  
  listEarthModes() {
    return getAvailableEarthModes();
  }
}

const app = new App();
app.init();

// 暴露到全局，方便在控制台使用
window.app = app;
window.EARTH_MODES = EARTH_MODES;
window.setEarthMode = (mode) => app.setEarthMode(mode);
window.getEarthMode = () => app.getEarthMode();
window.listEarthModes = () => app.listEarthModes();

console.log('=== 地球模式控制系统 ===');
console.log('可用模式:', EARTH_MODES);
console.log('使用方式:');
console.log('  window.listEarthModes() - 列出所有模式');
console.log('  window.setEarthMode(EARTH_MODES.STANDARD) - 切换模式');
console.log('  window.getEarthMode() - 获取当前模式');
console.log('========================');
