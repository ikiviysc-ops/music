import * as THREE from 'three';
import { latLngToVector3 } from '../utils/geo.js';
import { CITY_DATA, getCityColor } from '../data/cities.js';

const EARTH_RADIUS = 1.9;
const BEAM_WIDTH = 0.015;
const MIN_HEIGHT = 0.2;
const MAX_HEIGHT = 0.4;

const beamVertexShader = `
  varying float vY;
  varying vec3 vPos;
  void main() {
    vY = position.y;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const beamFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uPhase;
  uniform float uHeight;
  uniform float uIntensity;
  varying float vY;
  varying vec3 vPos;

  void main() {
    float t = clamp(vY / max(uHeight, 0.01), 0.0, 1.0);

    float alpha = smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(0.7, 1.0, t));
    alpha *= 0.6 + 0.4 * t;

    float breath = 0.7 + 0.3 * sin(uTime * 1.8 + uPhase);

    float surge = pow(max(0.0, sin(uTime * 3.5 + uPhase)), 8.0);
    float surgeY = fract(uTime * 0.6 + uPhase * 0.3);
    float surgeMask = smoothstep(surgeY - 0.15, surgeY, t) * (1.0 - smoothstep(surgeY, surgeY + 0.15, t));
    float surgeEffect = surge * surgeMask * 1.5;

    float ring = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.05, 0.1, t));
    ring += smoothstep(0.95, 0.98, t) * (1.0 - smoothstep(0.98, 1.0, t));
    ring *= 0.5;

    alpha *= breath;
    alpha += surgeEffect * 0.5;
    alpha += ring;
    alpha *= uIntensity;

    vec3 col = uColor * (0.6 + 0.6 * t);
    col += uColor * surgeEffect * 0.8;
    col += vec3(1.0) * ring * 0.3;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

function getBeamHeight(listeners) {
  const minL = 40000;
  const maxL = 140000;
  const t = Math.min(1, Math.max(0, (listeners - minL) / (maxL - minL)));
  return MIN_HEIGHT + t * (MAX_HEIGHT - MIN_HEIGHT);
}

function createBeamGeometry(height) {
  const h = Math.max(0.05, height);
  const geometry = new THREE.CylinderGeometry(
    BEAM_WIDTH * 0.3,
    BEAM_WIDTH,
    h,
    4,
    8,
    false
  );
  geometry.translate(0, h / 2, 0);
  return geometry;
}

export function createBeams(earthGroup) {
  const beams = [];
  const beamGroup = new THREE.Group();

  CITY_DATA.forEach((city) => {
    const color = getCityColor(city.region);
    const height = getBeamHeight(city.listeners);
    const phase = Math.random() * Math.PI * 2;
    const intensity = 0.5 + (city.listeners / 140000) * 0.5;

    const geometry = createBeamGeometry(height);
    const material = new THREE.ShaderMaterial({
      vertexShader: beamVertexShader,
      fragmentShader: beamFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(color.hex) },
        uTime: { value: 0 },
        uPhase: { value: phase },
        uHeight: { value: height },
        uIntensity: { value: intensity }
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

    beam.userData = { city, baseHeight: height, phase, colorHex: color.hex };
    beamGroup.add(beam);
    beams.push(beam);
  });

  earthGroup.add(beamGroup);
  return { beamGroup, beams };
}

export function updateBeams(beams, globalTime) {
  beams.forEach(beam => {
    if (beam.material.uniforms) {
      beam.material.uniforms.uTime.value = globalTime;
    }
  });
}
