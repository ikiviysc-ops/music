import * as THREE from 'three';
import { latLngToVector3 } from '../utils/geo.js';
import { CITY_DATA, getCityColor } from '../data/cities.js';

const EARTH_RADIUS = 1.9;
const BEAM_WIDTH = 0.06;
const HEIGHT_SCALE = 0.6;

const beamVertexShader = `
  varying float vY;
  varying float vHeight;
  void main() {
    vY = position.y;
    vHeight = vY;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const beamFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uRandomPhase;
  uniform float uOpacity;
  uniform float uHeight;
  varying float vY;
  varying float vHeight;

  void main() {
    float t = clamp(vY / max(uHeight, 0.01), 0.0, 1.0);
    float alpha = t * t;
    float pulse = 0.85 + sin(uTime * 2.0 + uRandomPhase) * 0.15;
    alpha *= pulse;
    alpha *= uOpacity;
    vec3 col = uColor * (0.8 + 0.4 * t);
    gl_FragColor = vec4(col, alpha);
  }
`;

function createBeamGeometry(height) {
  const h = Math.max(0.1, height);
  const geometry = new THREE.CylinderGeometry(
    BEAM_WIDTH * 0.2,
    BEAM_WIDTH,
    h,
    6,
    1,
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
        uOpacity: { value: 0.9 },
        uHeight: { value: height }
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
