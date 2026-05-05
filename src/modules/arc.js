import * as THREE from 'three';
import { latLngToVector3 } from '../utils/geo.js';
import { CITY_DATA, getCityColor } from '../data/cities.js';

const EARTH_RADIUS = 4.5;
const ARC_HEIGHT_FACTOR = 0.3;
const PARTICLES_PER_ARC = 30;
const ARC_CONNECTIONS = [
  [0, 10], [0, 6], [1, 10], [2, 0], [3, 2],
  [4, 7], [5, 16], [6, 7], [7, 8], [8, 9],
  [10, 11], [10, 12], [11, 12], [13, 11],
  [14, 5], [15, 14], [16, 4], [17, 5]
];

const arcVertexShader = `
  attribute float aProgress;
  attribute float aAlpha;
  varying float vAlpha;
  varying float vProgress;
  void main() {
    vAlpha = aAlpha;
    vProgress = aProgress;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = max(1.0, (3.0 - mvPosition.z / 20.0) * aAlpha);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const arcFragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vProgress;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float glow = 1.0 - dist * 2.0;
    glow = pow(glow, 1.5);
    float trailFade = smoothstep(0.0, 0.3, vProgress) * smoothstep(1.0, 0.7, vProgress);
    gl_FragColor = vec4(uColor, glow * vAlpha * trailFade);
  }
`;

function createArcCurve(startPos, endPos) {
  const mid = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
  const distance = startPos.distanceTo(endPos);
  mid.normalize().multiplyScalar(EARTH_RADIUS + distance * ARC_HEIGHT_FACTOR);

  const curve = new THREE.QuadraticBezierCurve3(startPos, mid, endPos);
  return curve;
}

export function createArcs(scene) {
  const isMobile = window.innerWidth <= 480;
  const maxArcs = isMobile ? 12 : ARC_CONNECTIONS.length;
  const arcGroup = new THREE.Group();
  const arcs = [];

  const connections = ARC_CONNECTIONS.slice(0, maxArcs);

  connections.forEach(([fromIdx, toIdx], arcIndex) => {
    const fromCity = CITY_DATA[fromIdx];
    const toCity = CITY_DATA[toIdx];
    if (!fromCity || !toCity) return;

    const fromPos = latLngToVector3(fromCity.lat, fromCity.lng, EARTH_RADIUS);
    const toPos = latLngToVector3(toCity.lat, toCity.lng, EARTH_RADIUS);
    const curve = createArcCurve(fromPos, toPos);

    const particleCount = isMobile ? 20 : PARTICLES_PER_ARC;
    const positions = new Float32Array(particleCount * 3);
    const progressArr = new Float32Array(particleCount);
    const alphaArr = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const point = curve.getPoint(t);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      progressArr[i] = t;
      alphaArr[i] = 1.0 - t * 0.6;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aProgress', new THREE.BufferAttribute(progressArr, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphaArr, 1));

    const fromColor = getCityColor(fromCity.region);
    const toColor = getCityColor(toCity.region);
    const mixColor = new THREE.Color(fromColor.hex).lerp(new THREE.Color(toColor.hex), 0.5);

    const material = new THREE.ShaderMaterial({
      vertexShader: arcVertexShader,
      fragmentShader: arcFragmentShader,
      uniforms: {
        uColor: { value: mixColor }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    points.userData = {
      curve,
      speed: 0.002 + Math.random() * 0.008,
      offset: Math.random(),
      particleCount
    };

    arcGroup.add(points);
    arcs.push(points);
  });

  scene.add(arcGroup);
  return { arcGroup, arcs };
}

export function updateArcs(arcs, globalTime) {
  arcs.forEach(arc => {
    const { curve, speed, offset, particleCount } = arc.userData;
    const positions = arc.geometry.attributes.position.array;
    const progressAttr = arc.geometry.attributes.aProgress;
    const alphaAttr = arc.geometry.attributes.aAlpha;

    const baseT = (globalTime * speed + offset) % 1.0;

    for (let i = 0; i < particleCount; i++) {
      const t = (baseT + i / particleCount) % 1.0;
      const point = curve.getPoint(t);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      progressAttr.array[i] = t;
      alphaAttr.array[i] = 1.0 - (i / particleCount) * 0.7;
    }

    arc.geometry.attributes.position.needsUpdate = true;
    progressAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  });
}
