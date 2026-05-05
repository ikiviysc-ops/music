import * as THREE from 'three';

const EARTH_RADIUS = 5;

export function latLngToVector3(lat, lng, radius = EARTH_RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

export function getDistance(pos1, pos2) {
  return pos1.distanceTo(pos2);
}
