import * as THREE from 'three';
import { createScene } from './core/scene.js';
import { createCamera, updateCameraAspect } from './core/camera.js';
import { createRenderer, updateRendererSize } from './core/renderer.js';
import { createControls } from './core/controls.js';
import { createEarth, updateEarth } from './modules/earth.js';
import { createCityPoints, createCityGlows } from './modules/cityPoints.js';
import { createLabelRenderer, updateLabelRendererSize, createCityLabels } from './modules/cityLabels.js';
import { createBeams, updateBeams, createEnergyPoints, updateEnergyPoints } from './modules/beam.js';
import { createArcs, updateArcs } from './modules/arc.js';
import { createComposer, updateComposerSize } from './effects/bloom.js';

class App {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.labelRenderer = null;
    this.composer = null;
    this.controls = null;
    this.earthGroup = null;
    this.cityPoints = null;
    this.cityGlows = null;
    this.cityLabels = [];
    this.beamData = null;
    this.energyData = null;
    this.arcData = null;
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
    this.labelRenderer = createLabelRenderer(this.container);
    this.controls = createControls(this.camera, this.renderer);

    this.addLights();
    this.addStars();
    this.addEarth();
    this.addCityPoints();
    this.addBeams();
    this.addArcs();
    this.addCityLabels();

    window.addEventListener('resize', this.onResize.bind(this));
    this.animate();
  }

  addLights() {
    const ambientLight = new THREE.AmbientLight(0x444488, 1);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 5, 10);
    this.scene.add(directionalLight);
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
      size: 0.15,
      transparent: true,
      opacity: 0.7,
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

  addCityPoints() {
    this.cityPoints = createCityPoints();
    this.cityGlows = createCityGlows();
    this.earthGroup.add(this.cityPoints);
    this.earthGroup.add(this.cityGlows);
  }

  addBeams() {
    this.beamData = createBeams(this.earthGroup);
    this.energyData = createEnergyPoints(this.earthGroup);
  }

  addArcs() {
    this.arcData = createArcs(this.earthGroup);
  }

  addCityLabels() {
    this.cityLabels = createCityLabels(this.scene);
  }

  onResize() {
    updateCameraAspect(this.camera, this.container);
    updateRendererSize(this.renderer, this.container);
    updateComposerSize(this.composer, this.container);
    updateLabelRendererSize(this.labelRenderer, this.container);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    if (this.earthGroup) {
      updateEarth(this.earthGroup, delta, elapsed);
    }

    if (this.beamData) {
      updateBeams(this.beamData.beams, elapsed);
    }

    if (this.energyData) {
      updateEnergyPoints(this.energyData.points, elapsed);
    }

    if (this.arcData) {
      updateArcs(this.arcData.arcs, elapsed);
    }

    this.controls.update();
    this.composer.render();
    this.labelRenderer.render(this.scene, this.camera);
  }
}

const app = new App();
app.init();
