import * as THREE from 'three';
import { createScene } from './core/scene.js';
import { createCamera, updateCameraAspect } from './core/camera.js';
import { createRenderer, updateRendererSize } from './core/renderer.js';
import { createControls } from './core/controls.js';
import { createEarth, updateEarth, setEarthMode, getCurrentEarthMode, getAvailableEarthModes, EARTH_MODES } from './modules/earth.js';
import { createBeams, updateBeams, updateLabels, updateBeamConfig, setBeamDimensions, getBeamConfig, getBeamDefaults } from './modules/beam.js';
import { createComposer, updateComposerSize } from './effects/bloom.js';
import { getMusicEngine } from './modules/ambient-music.js';

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
    this.beamLabels = null;
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
    
    this.setupBeamPanel();
    
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
    this.musicPlayer = getMusicEngine();
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

  setupBeamPanel() {
    const panel = document.getElementById('beam-panel');
    const btn = document.getElementById('beam-settings-btn');
    const closeBtn = document.getElementById('beam-panel-close');
    if (!panel || !btn) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('show');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.remove('show');
      });
    }

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== btn) {
        panel.classList.remove('show');
      }
    });

    const sliderMap = {
      'beam-width': { key: 'beamWidth', type: 'dim' },
      'beam-min-h': { key: 'beamMinH', type: 'dim' },
      'beam-max-h': { key: 'beamMaxH', type: 'dim' },
      'wisp-density': { key: 'wispDensity', type: 'shader', uniform: 'uWispDensity' },
      'wisp-speed': { key: 'wispSpeed', type: 'shader', uniform: 'uWispSpeed' },
      'wisp-intensity': { key: 'wispIntensity', type: 'shader', uniform: 'uWispIntensity' },
      'flow-speed': { key: 'flowSpeed', type: 'shader', uniform: 'uFlowSpeed' },
      'flow-strength': { key: 'flowStrength', type: 'shader', uniform: 'uFlowStrength' },
      'fog-intensity': { key: 'fogIntensity', type: 'shader', uniform: 'uFogIntensity' },
      'fog-scale': { key: 'fogScale', type: 'shader', uniform: 'uFogScale' },
      'fog-fall-speed': { key: 'fogFallSpeed', type: 'shader', uniform: 'uFogFallSpeed' },
      'decay': { key: 'decay', type: 'shader', uniform: 'uDecay' },
      'falloff-start': { key: 'falloffStart', type: 'shader', uniform: 'uFalloffStart' }
    };

    Object.entries(sliderMap).forEach(([sliderId, config]) => {
      const slider = document.getElementById(sliderId);
      const valSpan = document.getElementById(sliderId + '-val');
      if (!slider) return;

      slider.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        if (valSpan) {
          valSpan.textContent = val % 1 === 0 ? val.toString() : val.toFixed(2);
        }
        if (config.type === 'shader') {
          updateBeamConfig(config.uniform, val);
        } else if (config.type === 'dim') {
          const wSlider = document.getElementById('beam-width');
          const minHSlider = document.getElementById('beam-min-h');
          const maxHSlider = document.getElementById('beam-max-h');
          const defaults = getBeamDefaults();
          const w = wSlider ? parseFloat(wSlider.value) : defaults.BEAM_WIDTH;
          const minH = minHSlider ? parseFloat(minHSlider.value) : defaults.BEAM_MIN_HEIGHT;
          const maxH = maxHSlider ? parseFloat(maxHSlider.value) : defaults.BEAM_MAX_HEIGHT;
          setBeamDimensions(w, minH, maxH);
        }
      });
    });
  }

  setupNavUI() {
    const container = document.getElementById('gooeyNav');
    const filterEl = document.getElementById('gooeyFilter');
    const textEl = document.getElementById('gooeyText');
    if (!container) return;

    const animationTime = 600;
    const timeVariance = 1300;
    const particleCount = 17;
    const particleDistances = [90, 10];
    const particleR = 200;
    const colors = [1, 2, 3, 1, 2, 3, 1, 4];

    const noise = (n = 1) => n / 2 - Math.random() * n;

    const getXY = (distance, pointIndex, totalPoints) => {
      const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
      return [distance * Math.cos(angle), distance * Math.sin(angle)];
    };

    const createParticle = (i, t, d, r) => {
      const rotate = noise(r / 10);
      return {
        start: getXY(d[0], particleCount - i, particleCount),
        end: getXY(d[1] + noise(7), particleCount - i, particleCount),
        time: t,
        scale: 1 + noise(0.2),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
      };
    };

    const makeParticles = (element) => {
      const d = particleDistances;
      const r = particleR;
      const bubbleTime = animationTime * 2 + timeVariance;
      element.style.setProperty('--time', `${bubbleTime}ms`);

      for (let i = 0; i < particleCount; i++) {
        const t = animationTime * 2 + noise(timeVariance * 2);
        const p = createParticle(i, t, d, r);
        element.classList.remove('active');

        setTimeout(() => {
          const particle = document.createElement('span');
          const point = document.createElement('span');
          particle.classList.add('particle');
          particle.style.setProperty('--start-x', `${p.start[0]}px`);
          particle.style.setProperty('--start-y', `${p.start[1]}px`);
          particle.style.setProperty('--end-x', `${p.end[0]}px`);
          particle.style.setProperty('--end-y', `${p.end[1]}px`);
          particle.style.setProperty('--time', `${p.time}ms`);
          particle.style.setProperty('--scale', `${p.scale}`);
          particle.style.setProperty('--color', `var(--color-${p.color}, white)`);
          particle.style.setProperty('--rotate', `${p.rotate}deg`);

          point.classList.add('point');
          particle.appendChild(point);
          element.appendChild(particle);
          requestAnimationFrame(() => {
            element.classList.add('active');
          });
          setTimeout(() => {
            try { element.removeChild(particle); } catch (e) {}
          }, t);
        }, 30);
      }
    };

    const updateEffectPosition = (element) => {
      if (!container || !filterEl || !textEl) return;
      const containerRect = container.getBoundingClientRect();
      const pos = element.getBoundingClientRect();

      const styles = {
        left: `${pos.x - containerRect.x}px`,
        top: `${pos.y - containerRect.y}px`,
        width: `${pos.width}px`,
        height: `${pos.height}px`
      };
      Object.assign(filterEl.style, styles);
      Object.assign(textEl.style, styles);
      textEl.innerText = element.innerText;
    };

    const lis = container.querySelectorAll('li');
    lis.forEach((li, index) => {
      const link = li.querySelector('a');
      if (!link) return;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        const wasActive = li.classList.contains('active');
        if (wasActive) return;

        lis.forEach(l => l.classList.remove('active'));
        li.classList.add('active');

        updateEffectPosition(li);

        if (filterEl) {
          const particles = filterEl.querySelectorAll('.particle');
          particles.forEach(p => filterEl.removeChild(p));
        }

        if (textEl) {
          textEl.classList.remove('active');
          void textEl.offsetWidth;
          textEl.classList.add('active');
        }

        if (filterEl) {
          makeParticles(filterEl);
        }
      });
    });

    const activeLi = container.querySelector('li.active');
    if (activeLi) {
      updateEffectPosition(activeLi);
      if (textEl) textEl.classList.add('active');
    }
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
    const { beamGroup, beams, labels } = createBeams(this.earthGroup, this.camera);
    this.beamGroup = beamGroup;
    this.beams = beams;
    this.beamLabels = labels;
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
      updateBeams(this.beams, elapsed, this.camera);
      if (this.beamLabels) {
        updateLabels(this.beamLabels, this.camera);
      }
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
