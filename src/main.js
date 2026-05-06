import * as THREE from 'three';
import { createScene } from './core/scene.js';
import { createCamera, updateCameraAspect } from './core/camera.js';
import { createRenderer, updateRendererSize } from './core/renderer.js';
import { createControls } from './core/controls.js';
import { createEarth, updateEarth, setEarthMode, getCurrentEarthMode, getAvailableEarthModes, EARTH_MODES } from './modules/earth.js';
import { createBeams, updateBeams } from './modules/beam.js';
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
    this.beamGroup = null;
    this.beams = null;
    this.clock = new THREE.Clock();
    this.useComposer = true;
    this.isPlaying = false;
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
    this.addBeams();

    console.log('Scene children:', this.scene.children.length);
    console.log('Camera position:', this.camera.position);
    console.log('Earth group:', this.earthGroup);

    window.addEventListener('resize', this.onResize.bind(this));
    
    // 设置模式选择UI
    this.setupModeUI();
    
    // 设置播放器UI
    this.setupPlayerUI();
    
    // 设置导航UI
    this.setupNavUI();
    
    setTimeout(() => {
      this.onResize();
    }, 50);
    
    this.animate();
  }
  
  setupModeUI() {
    const modeBtn = document.getElementById('mode-btn');
    const modeMenu = document.getElementById('mode-menu');
    const modeItems = document.querySelectorAll('.mode-item');
    
    if (!modeBtn || !modeMenu || !modeItems.length) return;
    
    // 切换菜单显示
    modeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      modeMenu.classList.toggle('show');
      modeBtn.classList.toggle('active');
    });
    
    // 点击菜单项
    modeItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = item.dataset.mode;
        
        const modeMap = {
          'standard': EARTH_MODES.STANDARD,
          'translucent': EARTH_MODES.TRANSLUCENT,
          'daytime': EARTH_MODES.DAYTIME,
          'clouds': EARTH_MODES.CLOUDS,
          'points': EARTH_MODES.POINTS,
          'cityLights': EARTH_MODES.CITY_LIGHTS
        };
        
        if (modeMap[mode]) {
          this.setEarthMode(modeMap[mode]);
          this.updateModeUI(mode);
        }
        
        modeMenu.classList.remove('show');
        modeBtn.classList.remove('active');
      });
    });
    
    document.addEventListener('click', () => {
      modeMenu.classList.remove('show');
      modeBtn.classList.remove('active');
    });
    
    const currentMode = getCurrentEarthMode();
    const modeKey = Object.keys(EARTH_MODES).find(k => EARTH_MODES[k] === currentMode) || 'cityLights';
    this.updateModeUI(modeKey.toLowerCase());
  }
  
  setupPlayerUI() {
    this.musicPlayer = document.getElementById('musicPlayer');
    const fpPlayerWrap = document.getElementById('fpPlayerWrap');
    const fpPlayerCard = document.getElementById('fpPlayerCard');
    const fpProgressFill = document.getElementById('fpProgressFill');

    const doTogglePlay = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.togglePlay();
    };

    if (fpPlayerWrap) {
      fpPlayerWrap.style.cursor = 'pointer';
      fpPlayerWrap.addEventListener('click', doTogglePlay, true);
      fpPlayerWrap.addEventListener('touchend', doTogglePlay, true);
    }

    if (fpPlayerCard) {
      fpPlayerCard.addEventListener('click', (e) => {
        if (e.target.closest('#fpPlayerWrap')) return;
        const rect = fpPlayerCard.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        if (fpProgressFill) {
          fpProgressFill.style.width = `${Math.max(0, Math.min(100, percent * 100))}%`;
        }
        if (this.musicPlayer && this.musicPlayer.duration > 0) {
          this.musicPlayer.currentTime = percent * this.musicPlayer.duration;
        }
      });
    }
    
    if (this.musicPlayer) {
      this.musicPlayer.addEventListener('timeupdate', () => {
        this.updateProgress();
      });
      
      this.musicPlayer.addEventListener('loadedmetadata', () => {
        this.updateTimeDisplay();
      });
      
      this.musicPlayer.addEventListener('ended', () => {
        this.isPlaying = false;
        this.updatePlayerUI();
      });
      
      this.musicPlayer.addEventListener('play', () => {
        this.isPlaying = true;
        this.updatePlayerUI();
      });
      
      this.musicPlayer.addEventListener('pause', () => {
        this.isPlaying = false;
        this.updatePlayerUI();
      });
    }
    
    this.animateWave();
  }
  
  togglePlay() {
    if (!this.musicPlayer) return;

    if (this.isPlaying) {
      this.musicPlayer.pause();
    } else {
      const p = this.musicPlayer.play();
      if (p && p.catch) {
        p.catch(() => {
          this.isPlaying = false;
          this.updatePlayerUI();
        });
      }
    }
  }
  
  updatePlayerUI() {
    const fpPlayerWrap = document.getElementById('fpPlayerWrap');
    const fpMusicCover = document.getElementById('fpMusicCover');
    if (!fpPlayerWrap) return;
    
    if (this.isPlaying) {
      fpPlayerWrap.classList.add('playing');
      if (fpMusicCover) {
        fpMusicCover.classList.add('playing');
      }
    } else {
      fpPlayerWrap.classList.remove('playing');
      if (fpMusicCover) {
        fpMusicCover.classList.remove('playing');
      }
    }
  }
  
  updateProgress() {
    if (!this.musicPlayer || this.musicPlayer.duration === 0) return;
    
    const fpProgressFill = document.getElementById('fpProgressFill');
    const progress = (this.musicPlayer.currentTime / this.musicPlayer.duration) * 100;
    
    if (fpProgressFill) {
      fpProgressFill.style.width = `${progress}%`;
    }
    
    this.updateTimeDisplay();
  }
  
  updateTimeDisplay() {
    if (!this.musicPlayer) return;
    
    const fpTimeDisplay = document.getElementById('fpTimeDisplay');
    if (!fpTimeDisplay) return;
    
    const currentTime = this.formatTime(this.musicPlayer.currentTime);
    const duration = this.musicPlayer.duration > 0 ? this.formatTime(this.musicPlayer.duration) : '0:00';
    
    fpTimeDisplay.textContent = `${currentTime} / ${duration}`;
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  animateWave() {
    const wave1 = document.getElementById('fpWave1');
    const wave2 = document.getElementById('fpWave2');
    if (!wave1 || !wave2) return;
    
    let time = 0;
    const animate = () => {
      time += 0.02;
      
      const amplitude = this.isPlaying ? 2.5 + Math.sin(time * 2) * 0.5 : 1.5;
      const frequency = this.isPlaying ? 0.15 : 0.08;
      
      let path1 = '';
      let path2 = '';
      for (let x = 0; x <= 32; x++) {
        const y1 = 16 + Math.sin((x + time * 30) * frequency * Math.PI) * amplitude * 0.8;
        const y2 = 16 + Math.sin((x + time * 25 + 10) * frequency * Math.PI) * amplitude;
        path1 += (x === 0 ? 'M' : 'L') + x + ',' + y1 + ' ';
        path2 += (x === 0 ? 'M' : 'L') + x + ',' + y2 + ' ';
      }
      path1 += 'L32,32 L0,32 Z';
      path2 += 'L32,32 L0,32 Z';
      
      wave1.setAttribute('d', path1);
      wave2.setAttribute('d', path2);
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  setupNavUI() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const navNames = ['首页', '发现', '电台', '收藏', '我的'];
        console.log(`导航到: ${navNames[index]}`);
      });
    });
  }
  
  updateModeUI(activeMode) {
    const modeItems = document.querySelectorAll('.mode-item');
    modeItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.mode === activeMode) {
        item.classList.add('active');
      }
    });
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

  addBeams() {
    const { beamGroup, beams } = createBeams(this.earthGroup);
    this.beamGroup = beamGroup;
    this.beams = beams;
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

    if (this.beams) {
      updateBeams(this.beams, elapsed);
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
