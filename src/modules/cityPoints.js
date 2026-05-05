import * as THREE from 'three';
import { latLngToVector3 } from '../utils/geo.js';
import { CITY_DATA, getCityColor } from '../data/cities.js';

const EARTH_RADIUS = 3.5;
const POINT_SIZE = 0.06;
const GLOW_SIZE = 0.18;

export function createCityPoints() {
  const count = CITY_DATA.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  CITY_DATA.forEach((city, i) => {
    const pos = latLngToVector3(city.lat, city.lng, EARTH_RADIUS + 0.02);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;

    const color = getCityColor(city.region);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = POINT_SIZE;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: POINT_SIZE,
    vertexColors: true,
    transparent: true,
    opacity: 1.0,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Points(geometry, material);
}

export function createCityGlows() {
  const count = CITY_DATA.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  CITY_DATA.forEach((city, i) => {
    const pos = latLngToVector3(city.lat, city.lng, EARTH_RADIUS + 0.01);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;

    const color = getCityColor(city.region);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: GLOW_SIZE,
    vertexColors: true,
    transparent: true,
    opacity: 0.3,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Points(geometry, material);
}

export function getCityPositions() {
  return CITY_DATA.map(city => ({
    ...city,
    position: latLngToVector3(city.lat, city.lng, EARTH_RADIUS)
  }));
}
