import * as THREE from 'three';

export class SceneManager {
  constructor(options = {}) {
    this.options = {
      bgColor: 0x000000,
      ...options
    };
    
    this.scene = new THREE.Scene();
    this.init();
  }
  
  init() {
    this.scene.background = new THREE.Color(this.options.bgColor);
    this.scene.fog = new THREE.Fog(this.options.bgColor, 10, 50);
  }
  
  add(object) {
    this.scene.add(object);
  }
  
  remove(object) {
    this.scene.remove(object);
  }
  
  getScene() {
    return this.scene;
  }
}
