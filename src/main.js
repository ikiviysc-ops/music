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
    this.globe = null;
    this.particleData = null;
    this.clock = new THREE.Clock();
  }

  init() {
    this.container = document.getElementById('canvas-container');
    if (!this.container) {
      console.error('canvas-container not found');
      return;
    }

    this.scene = createScene();
    this.camera = createCamera(this.container);
    this.renderer = createRenderer(this.container);
    this.composer = createComposer(this.renderer, this.scene, this.camera);
    this.controls = createControls(this.camera, this.renderer);

    this.addLights();
    this.addStars();
    this.addEarth();
    this.addParticles();

    window.addEventListener('resize', this.onResize.bind(this));
    this.animate();
  }

  addLights() {
    const ambientLight = new THREE.AmbientLight(0x334466, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4488ff, 0.5, 50);
    pointLight.position.set(-5, 2, -5);
    this.scene.add(pointLight);
  }

  addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 40 + Math.random() * 40;
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
    this.globe = createEarth();
    this.scene.add(this.globe);
  }

  addParticles() {
    this.particleData = createParticles(this.scene);
  }

  onResize() {
    updateCameraAspect(this.camera, this.container);
    updateRendererSize(this.renderer, this.container);
    updateComposerSize(this.composer, this.container);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    if (this.globe) {
      updateEarth(this.globe, delta, elapsed);
    }

    if (this.particleData) {
      updateParticles(this.particleData, elapsed, delta);
    }

    this.controls.update();
    this.composer.render();
  }
}

const app = new App();
app.init();
