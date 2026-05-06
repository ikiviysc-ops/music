import * as THREE from 'three';
import { latLngToVector3 } from '../utils/geo.js';
import { CITY_DATA, getCityColor } from '../data/cities.js';

const EARTH_RADIUS = 1.9;
const ARC_MIN_HEIGHT = 0.4;
const ARC_MAX_HEIGHT = 0.7;
const ARC_SEGMENTS = 40;
const PARTICLES_PER_ARC = 24;
const LABEL_SIZE = 0.66;
const TEX_W = 256;
const TEX_H = 320;

const arcLineVertexShader = `
  attribute float aProgress;
  varying float vProgress;
  void main() {
    vProgress = aProgress;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const arcLineFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uPhase;
  varying float vProgress;

  void main() {
    float alpha = smoothstep(0.0, 0.1, vProgress) * smoothstep(1.0, 0.85, vProgress);
    alpha *= 0.5 + 0.3 * vProgress;
    float pulse = 0.8 + 0.2 * sin(uTime * 2.0 + uPhase);
    alpha *= pulse;
    float flow = fract(vProgress - uTime * 0.3 + uPhase);
    float trail = smoothstep(0.0, 0.15, flow) * smoothstep(0.4, 0.15, flow);
    alpha += trail * 0.4;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const particleVertexShader = `
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = max(1.5, 3.0 * aAlpha);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float glow = 1.0 - dist * 2.0;
    glow = pow(glow, 1.5);
    gl_FragColor = vec4(uColor, glow * vAlpha);
  }
`;

function createArcCurve(surfacePos, direction, height, city) {
  const east = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
  if (east.length() < 0.01) {
    east.crossVectors(new THREE.Vector3(1, 0, 0), direction).normalize();
  }
  const north = new THREE.Vector3().crossVectors(direction, east).normalize();
  const lngRad = (city.lng * Math.PI) / 180;
  const latRad = (city.lat * Math.PI) / 180;
  const bendAngle = lngRad * 0.6 + latRad * 0.2;
  const bendDir = east.clone().multiplyScalar(Math.cos(bendAngle))
    .add(north.clone().multiplyScalar(Math.sin(bendAngle)))
    .normalize();

  const straightUp = surfacePos.clone().add(direction.clone().multiplyScalar(height * 0.65));
  const peakPos = surfacePos.clone()
    .add(direction.clone().multiplyScalar(height * 0.95))
    .add(bendDir.clone().multiplyScalar(height * 0.15));
  const endPos = surfacePos.clone()
    .add(direction.clone().multiplyScalar(height * 0.55))
    .add(bendDir.clone().multiplyScalar(height * 0.7));

  const cp1 = straightUp.clone();
  const cp2 = peakPos.clone()
    .add(bendDir.clone().multiplyScalar(height * 0.25));

  return { curve: new THREE.CubicBezierCurve3(surfacePos, cp1, cp2, endPos), endPos };
}

function drawLabelCanvas(ctx, city, color, imgSource) {
  ctx.clearRect(0, 0, TEX_W, TEX_H);

  const imgSize = 112;
  const imgX = (TEX_W - imgSize) / 2;
  const imgY = 20;

  if (imgSource) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(imgSource, imgX, imgY, imgSize, imgSize);
    ctx.restore();
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(imgX, imgY, imgSize, imgSize);
    ctx.restore();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(city.city, TEX_W / 2, imgY + imgSize + 40);

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '22px sans-serif';
  ctx.fillText(city.cityEn, TEX_W / 2, imgY + imgSize + 72);

  ctx.fillStyle = color;
  ctx.font = '18px sans-serif';
  const listeners = city.listeners >= 1000 ? (city.listeners / 1000).toFixed(0) + 'K' : city.listeners;
  ctx.fillText('♫ ' + listeners, TEX_W / 2, imgY + imgSize + 100);
}

function createCityLabelTexture(city, color) {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  drawLabelCanvas(ctx, city, color, null);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

function getArcHeight(listeners) {
  const minL = 40000;
  const maxL = 140000;
  const t = Math.min(1, Math.max(0, (listeners - minL) / (maxL - minL)));
  return ARC_MIN_HEIGHT + t * (ARC_MAX_HEIGHT - ARC_MIN_HEIGHT);
}

export function createBeams(earthGroup, camera) {
  const beams = [];
  const labels = [];
  const beamGroup = new THREE.Group();
  const loader = new THREE.TextureLoader();

  CITY_DATA.forEach((city, cityIndex) => {
    const color = getCityColor(city.region);
    const height = getArcHeight(city.listeners);
    const phase = Math.random() * Math.PI * 2;

    const surfacePos = latLngToVector3(city.lat, city.lng, EARTH_RADIUS);
    const direction = surfacePos.clone().normalize();
    const { curve, endPos } = createArcCurve(surfacePos, direction, height, city);

    const linePoints = curve.getPoints(ARC_SEGMENTS);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineUvArr = new Float32Array((ARC_SEGMENTS + 1));
    for (let i = 0; i <= ARC_SEGMENTS; i++) lineUvArr[i] = i / ARC_SEGMENTS;
    lineGeometry.setAttribute('aProgress', new THREE.BufferAttribute(lineUvArr, 1));

    const lineMaterial = new THREE.ShaderMaterial({
      vertexShader: arcLineVertexShader,
      fragmentShader: arcLineFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(color.hex) },
        uTime: { value: 0 },
        uPhase: { value: phase }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const line = new THREE.Line(lineGeometry, lineMaterial);
    beamGroup.add(line);

    const pCount = PARTICLES_PER_ARC;
    const pPositions = new Float32Array(pCount * 3);
    const pAlphas = new Float32Array(pCount);
    for (let i = 0; i < pCount; i++) {
      const t = i / pCount;
      const pt = curve.getPoint(t);
      pPositions[i * 3] = pt.x;
      pPositions[i * 3 + 1] = pt.y;
      pPositions[i * 3 + 2] = pt.z;
      pAlphas[i] = 1.0 - t * 0.5;
    }
    const pGeometry = new THREE.BufferGeometry();
    pGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(pAlphas, 1));

    const pMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: { uColor: { value: new THREE.Color(color.hex) } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(pGeometry, pMaterial);
    particles.userData = { curve, speed: 0.15 + Math.random() * 0.1, offset: Math.random(), pCount };
    beamGroup.add(particles);
    const labelTexture = createCityLabelTexture(city, color.hex);
    const labelMaterial = new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      sizeAttenuation: true,
      blending: THREE.NormalBlending
    });
    const label = new THREE.Sprite(labelMaterial);
    label.position.copy(endPos);
    label.scale.set(LABEL_SIZE * 0.8, LABEL_SIZE, 1);
    label.userData = { city, baseHeight: height };
    beamGroup.add(label);
    labels.push(label);

    if (city.img) {
      loader.load(city.img, (tex) => {
        const canvas = document.createElement('canvas');
        canvas.width = TEX_W;
        canvas.height = TEX_H;
        const ctx = canvas.getContext('2d');
        drawLabelCanvas(ctx, city, color.hex, tex.image);
        const newTex = new THREE.CanvasTexture(canvas);
        newTex.minFilter = THREE.LinearFilter;
        newTex.magFilter = THREE.LinearFilter;
        newTex.generateMipmaps = false;
        labelMaterial.map = newTex;
        labelMaterial.needsUpdate = true;
      }, undefined, () => {});
    }

    beams.push({ line, particles, city, phase, height });
  });

  earthGroup.add(beamGroup);
  return { beamGroup, beams, labels };
}

export function updateBeams(beams, globalTime, camera) {
  beams.forEach(({ line, particles, phase }) => {
    if (line.material.uniforms) {
      line.material.uniforms.uTime.value = globalTime;
    }

    const { curve, speed, offset, pCount } = particles.userData;
    const positions = particles.geometry.attributes.position.array;
    const alphaAttr = particles.geometry.attributes.aAlpha;
    const baseT = (globalTime * speed + offset) % 1.0;

    for (let i = 0; i < pCount; i++) {
      const t = (baseT + i / pCount) % 1.0;
      const pt = curve.getPoint(t);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
      alphaAttr.array[i] = 1.0 - (i / pCount) * 0.6;
    }
    particles.geometry.attributes.position.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  });
}

export function updateLabels(labels, camera) {
}
