import * as THREE from 'three';
import { createScene } from './core/scene.js';
import { createCamera, updateCameraAspect } from './core/camera.js';
import { createRenderer, updateRendererSize } from './core/renderer.js';
import { createControls } from './core/controls.js';
import { createEarth, updateEarth } from './modules/earth.js';

class App {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.earthGroup = null;
    this.clock = new THREE.Clock();
    this.animationId = null;
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
    this.controls = createControls(this.camera, this.renderer);

    this.addLights();
    this.addStars();
    this.addEarth();

    window.addEventListener('resize', this.onResize.bind(this));

    this.animate();
  }

  addLights() {
    const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);
  }

  addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 1500;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      sizes[i] = Math.random() * 1.5 + 0.5;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
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

  onResize() {
    updateCameraAspect(this.camera, this.container);
    updateRendererSize(this.renderer, this.container);
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    if (this.earthGroup) {
      updateEarth(this.earthGroup, delta);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.dispose();
  }
}

const app = new App();
app.init();
