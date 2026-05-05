import * as THREE from 'three';
import gsap from 'gsap';
import { latLngToVector3 } from '../utils/geo.js';
import { CITY_DATA } from '../data/cities.js';

const EARTH_RADIUS = 2.0;
const FLY_DURATION = 1.2;
const FLY_EASE = 'power3.inOut';
const CAMERA_DISTANCE = 8;

export class InteractionManager {
  constructor(camera, controls, renderer) {
    this.camera = camera;
    this.controls = controls;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isFlying = false;
    this.selectedCity = null;
    this.onClickCallback = null;
    this.onHoverCallback = null;
    this.isTouch = 'ontouchstart' in window;
  }

  init(beamMeshes, energyPointMeshes) {
    this.clickTargets = [...beamMeshes, ...energyPointMeshes];

    if (this.isTouch) {
      this.renderer.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
    } else {
      this.renderer.domElement.addEventListener('click', this.onClick.bind(this));
      this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    }
  }

  onTouchEnd(event) {
    if (this.isFlying) return;
    const touch = event.changedTouches[0];
    this.updateMouse(touch.clientX, touch.clientY);
    this.performRaycast();
  }

  onClick(event) {
    if (this.isFlying) return;
    this.updateMouse(event.clientX, event.clientY);
    this.performRaycast();
  }

  onMouseMove(event) {
    this.updateMouse(event.clientX, event.clientY);
    this.performHover();
  }

  updateMouse(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  performRaycast() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.clickTargets, false);

    if (intersects.length > 0) {
      const target = intersects[0].object;
      const city = target.userData.city;
      if (city) {
        this.flyToCity(city);
      }
    }
  }

  performHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.clickTargets, false);

    if (intersects.length > 0) {
      const target = intersects[0].object;
      const city = target.userData.city;
      if (city && this.onHoverCallback) {
        this.onHoverCallback(city, target);
      }
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.renderer.domElement.style.cursor = 'grab';
    }
  }

  flyToCity(city) {
    if (this.isFlying) return;
    this.isFlying = true;
    this.selectedCity = city;

    const targetPos = latLngToVector3(city.lat, city.lng, EARTH_RADIUS);
    const direction = targetPos.clone().normalize();
    const cameraTarget = direction.multiplyScalar(CAMERA_DISTANCE);

    gsap.to(this.camera.position, {
      x: cameraTarget.x,
      y: cameraTarget.y,
      z: cameraTarget.z,
      duration: FLY_DURATION,
      ease: FLY_EASE,
      onUpdate: () => {
        this.camera.lookAt(0, 0, 0);
      },
      onComplete: () => {
        this.isFlying = false;
        if (this.onClickCallback) {
          this.onClickCallback(city);
        }
      }
    });
  }

  resetView() {
    if (this.isFlying) return;
    this.isFlying = true;
    this.selectedCity = null;

    gsap.to(this.camera.position, {
      x: 0,
      y: 0.3,
      z: 12,
      duration: FLY_DURATION,
      ease: FLY_EASE,
      onUpdate: () => {
        this.camera.lookAt(0, 0, 0);
      },
      onComplete: () => {
        this.isFlying = false;
      }
    });
  }

  setOnClickCallback(cb) {
    this.onClickCallback = cb;
  }

  setOnHoverCallback(cb) {
    this.onHoverCallback = cb;
  }
}
