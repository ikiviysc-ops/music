import * as THREE from 'three';
import { latLngToVector3 } from '../utils/geo.js';
import { CITY_DATA, getCityColor } from '../data/cities.js';

const EARTH_RADIUS = 1.5;
const BEAM_WIDTH = 0.08;
const HEIGHT_SCALE = 0.8;
const BREATH_SPEED = 2.0;
const BREATH_AMPLITUDE = 0.1;

const beamVertexShader = `
  varying float vY;
  varying vec3 vWorldPos;
  void main() {
    vY = position.y;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const beamFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uRandomPhase;
  uniform float uOpacity;
  varying float vY;
  varying vec3 vWorldPos;

  void main() {
    float alpha = smoothstep(0.0, 1.0, vY);
    float pulse = 0.9 + sin(uTime * 2.0 + uRandomPhase) * 0.1;
    float edgeFade = 1.0 - smoothstep(0.3, 1.0, abs(vWorldPos.x) + abs(vWorldPos.z));
    alpha *= (0.4 + 0.6 * alpha);
    alpha *= pulse;
    alpha *= edgeFade;
    gl_FragColor = vec4(uColor * pulse, alpha * uOpacity);
  }
`;

function createBeamGeometry(height) {
  const h = Math.max(0.1, height);
  const geometry = new THREE.CylinderGeometry(
    BEAM_WIDTH * 0.3,
    BEAM_WIDTH,
    h,
    8,
    16,
    false
  );
  geometry.translate(0, h / 2, 0);
  return geometry;
}

export function createBeams(scene) {
  const beams = [];
  const beamGroup = new THREE.Group();

  CITY_DATA.forEach((city, index) => {
    const color = getCityColor(city.region);
    const height = Math.log(city.listeners + 1) * HEIGHT_SCALE;
    const randomPhase = Math.random() * Math.PI * 2;

    const geometry = createBeamGeometry(height);
    const material = new THREE.ShaderMaterial({
      vertexShader: beamVertexShader,
      fragmentShader: beamFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(color.hex) },
        uTime: { value: 0 },
        uRandomPhase: { value: randomPhase },
        uOpacity: { value: 0.85 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    const beam = new THREE.Mesh(geometry, material);
    const surfacePos = latLngToVector3(city.lat, city.lng, EARTH_RADIUS);
    beam.position.copy(surfacePos);

    const up = surfacePos.clone().normalize();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    beam.quaternion.copy(quaternion);

    beam.userData = {
      city,
      baseHeight: height,
      randomPhase,
      colorHex: color.hex
    };

    beamGroup.add(beam);
    beams.push(beam);
  });

  scene.add(beamGroup);
  return { beamGroup, beams };
}

export function updateBeams(beams, globalTime) {
  beams.forEach(beam => {
    if (beam.material.uniforms) {
      beam.material.uniforms.uTime.value = globalTime;
    }
  });
}

export function createEnergyPoints(scene) {
  const points = [];
  const pointGroup = new THREE.Group();

  CITY_DATA.forEach((city) => {
    const color = getCityColor(city.region);
    const height = Math.log(city.listeners + 1) * HEIGHT_SCALE;
    const surfacePos = latLngToVector3(city.lat, city.lng, EARTH_RADIUS);
    const direction = surfacePos.clone().normalize();
    const topPos = surfacePos.clone().add(direction.multiplyScalar(height));

    const geometry = new THREE.SphereGeometry(0.06, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color.hex),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const point = new THREE.Mesh(geometry, material);
    point.position.copy(topPos);
    point.userData = { city, baseHeight: height, randomPhase: Math.random() * Math.PI * 2 };

    pointGroup.add(point);
    points.push(point);
  });

  scene.add(pointGroup);
  return { pointGroup, points };
}

export function updateEnergyPoints(points, globalTime) {
  points.forEach(point => {
    const { randomPhase } = point.userData;
    const scale = 1.0 + Math.sin(globalTime * 2.0 + randomPhase) * 0.2;
    point.scale.set(scale, scale, scale);
    point.material.opacity = 0.7 + Math.sin(globalTime * 2.0 + randomPhase) * 0.2;
  });
}
