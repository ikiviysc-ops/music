import * as THREE from 'three';
import { createScene } from './core/scene.js';
import { createCamera, updateCameraAspect } from './core/camera.js';
import { createRenderer, updateRendererSize } from './core/renderer.js';
import { createControls } from './core/controls.js';
import { createEarth, updateEarth } from './modules/earth.js';
import { createParticles, updateParticles } from './modules/particles.js';
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
    this.particleData = null;
    this.clock = new THREE.Clock();
    this.useComposer = true;
  }

  init() {
    this.container = document.getElementById('canvas-container');
    if (!this.container) {
      console.error('canvas-container not found');
      return;
    }

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
    this.addStars();
    this.addEarth();
    this.addParticles();

    console.log('Scene children:', this.scene.children.length);
    console.log('Camera position:', this.camera.position);
    console.log('Earth group:', this.earthGroup);

    window.addEventListener('resize', this.onResize.bind(this));
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

  addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 30 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      depthWrite: false
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  addEarth() {
    this.earthGroup = createEarth();
    this.scene.add(this.earthGroup);
  }

  addParticles() {
    this.particleData = createParticles(this.scene);
  }

  onResize() {
    updateCameraAspect(this.camera, this.container);
    updateRendererSize(this.renderer, this.container);
    if (this.useComposer && this.composer) {
      updateComposerSize(this.composer, this.container);
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    if (this.earthGroup) {
      updateEarth(this.earthGroup, delta, elapsed);
    }

    if (this.particleData) {
      updateParticles(this.particleData, elapsed, delta);
    }

    this.controls.update();

    if (this.useComposer && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

const app = new App();
app.init();
