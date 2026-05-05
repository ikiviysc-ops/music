import * as THREE from 'three';

export class CameraManager {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      fov: 45,
      near: 0.1,
      far: 1000,
      position: new THREE.Vector3(0, 0, 15),
      ...options
    };
    
    this.camera = null;
    this.init();
  }
  
  init() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(
      this.options.fov,
      aspect,
      this.options.near,
      this.options.far
    );
    this.camera.position.copy(this.options.position);
    this.camera.lookAt(0, 0, 0);
  }
  
  updateAspect() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
  
  getCamera() {
    return this.camera;
  }
}
