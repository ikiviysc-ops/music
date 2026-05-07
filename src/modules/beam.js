import * as THREE from 'three';
import { latLngToVector3 } from '../utils/geo.js';
import { CITY_DATA, getCityColor } from '../data/cities.js';

const EARTH_RADIUS = 1.6;
const BEAM_MIN_HEIGHT = 0.8;
const BEAM_MAX_HEIGHT = 1.3;
const BEAM_WIDTH = 0.12;
const LABEL_SIZE = 1.0;
const TEX_W = 256;
const TEX_H = 160;

const _beamConfig = {
  wispDensity: 3.0,
  wispSpeed: 18.0,
  wispIntensity: 8.0,
  flowSpeed: 0.5,
  flowStrength: 0.5,
  fogIntensity: 0.2,
  fogScale: 0.3,
  fogFallSpeed: 0.5,
  decay: 3.0,
  falloffStart: 0.5
};

const beamVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const beamFragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform float uPhase;
uniform float uWispDensity;
uniform float uWispSpeed;
uniform float uWispIntensity;
uniform float uFlowSpeed;
uniform float uFlowStrength;
uniform float uFogIntensity;
uniform float uFogScale;
uniform float uFogFallSpeed;
uniform float uDecay;
uniform float uFalloffStart;

varying vec2 vUv;

#define PI 3.14159265359
#define EPS 1e-6

float h21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.123);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = h21(i), b = h21(i + vec2(1,0)), c = h21(i + vec2(0,1)), d = h21(i + vec2(1,1));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, amp = 0.6;
  mat2 m = mat2(0.86, 0.5, -0.5, 0.86);
  for (int i = 0; i < 4; ++i) {
    v += amp * vnoise(p);
    p = m * p * 2.03 + 17.1;
    amp *= 0.52;
  }
  return v;
}

float tri01(float x) {
  float f = fract(x);
  return 1.0 - abs(f * 2.0 - 1.0);
}

float rGate(float x, float l, float aa) {
  float a = smoothstep(0.0, aa, x);
  float b = 1.0 - smoothstep(l, l + aa, x);
  return max(0.0, a * b);
}

void main() {
  vec2 uv = vUv;
  float y = uv.y;
  float x = uv.x;

  float topFade = pow(1.0 - smoothstep(0.0, 1.0, y), uDecay);
  float bottomFade = smoothstep(0.0, 0.08, y);

  float cx = (x - 0.5) * 2.0;
  float beamCore = exp(-cx * cx * 8.0);
  float beamWide = exp(-cx * cx * 2.0);

  float flowPhase = y / max(0.3, 0.3) + uTime * uFlowSpeed + uPhase;
  float flow = pow(tri01(flowPhase), 1.5);
  float flowMod = mix(1.0 - uFlowStrength, 1.0, flow);

  float L = (beamCore * 1.2 + beamWide * 0.4) * topFade * bottomFade * flowMod;

  float wispSum = 0.0;
  float yf = (y + uTime * uWispSpeed * 0.01) / 15.0 + uPhase;
  int lanes = int(max(1.0, floor(uWispDensity * 6.0 + 0.5)));
  for (int s = 0; s < 2; ++s) {
    float sgn = s == 0 ? -1.0 : 1.0;
    for (int i = 0; i < 6; ++i) {
      if (i >= lanes) break;
      float off = 0.08 + float(i) * 0.04;
      float xc = 0.5 + sgn * off * (1.0 + 0.5 * topFade);
      float dx = abs(x - xc);
      float lat = 1.0 - smoothstep(0.005, 0.02, dx);
      float amp = exp(-off * 3.0);
      float seed = h21(vec2(off, sgn * 17.0));
      float yf2 = yf + seed * 7.0;
      float ci = floor(yf2);
      float fy = fract(yf2);
      float seg = mix(0.01, 0.4, h21(vec2(ci, off * 2.3)));
      float spR = h21(vec2(ci, off + sgn * 31.0));
      float seg1 = rGate(fy, seg, 0.15) * step(spR, min(uWispDensity, 1.0));
      if (uWispDensity > 1.0) {
        float spR2 = h21(vec2(ci * 3.1 + 7.0, off * 5.3 + sgn * 13.0));
        float f2 = fract(fy + 0.5);
        seg1 += rGate(f2, seg * 0.9, 0.15) * step(spR2, uWispDensity - 1.0);
      }
      wispSum += amp * lat * seg1;
    }
  }
  float wisp = uWispIntensity * 0.02 * wispSum * topFade * bottomFade;

  float fog = 0.0;
  if (uFogIntensity > 0.0) {
    vec2 fuv = vec2(cx, y - 0.5) * uFogScale;
    fuv += uTime * uFogFallSpeed * vec2(0.1, -0.1);
    fuv += vec2(fbm(fuv + vec2(7.3, 2.1)), fbm(fuv + vec2(-3.7, 5.9))) * 0.3;
    float n = fbm(fuv);
    n = pow(clamp(n, 0.0, 1.0), 1.2);
    float beamMask = smoothstep(0.0, 0.75, L);
    float expandMask = 1.0 - pow(1.0 - beamMask, 8.0);
    expandMask = mix(expandMask * beamMask, expandMask, 0.5);
    float bottomBias = mix(1.0, 1.0 - y, 0.8);
    fog = n * uFogIntensity * 1.8 * bottomBias * expandMask;
  }

  float LF = L + fog;
  float tone = LF + wisp;
  tone = clamp(tone, 0.0, 1.0);
  tone = pow(tone, 1.0 / 2.4) * 1.055 - 0.055;
  tone = max(0.0, tone);

  float alpha = clamp(L + wisp * 0.6 + fog * 0.5, 0.0, 1.0);
  float edgeFade = 1.0 - smoothstep(0.35, 0.5, abs(cx));
  alpha *= edgeFade;

  vec3 col = tone * uColor;

  gl_FragColor = vec4(col, alpha);
}
`;

function drawLabelCanvas(ctx, city, color, imgSource) {
  ctx.clearRect(0, 0, TEX_W, TEX_H);

  const imgSize = 60;
  const imgX = 12;
  const imgY = (TEX_H - imgSize) / 2;

  if (imgSource) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(imgSource, imgX, imgY, imgSize, imgSize);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(imgX, imgY, imgSize, imgSize);
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

  const textX = imgX + imgSize + 14;
  const textW = TEX_W - textX - 10;
  ctx.textAlign = 'left';

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(city.city, textX, imgY + 22, textW);

  ctx.fillStyle = 'rgba(200,200,200,0.65)';
  ctx.font = '15px sans-serif';
  ctx.fillText(city.cityEn, textX, imgY + 42, textW);

  ctx.fillStyle = color;
  ctx.font = '13px sans-serif';
  const listeners = city.listeners >= 1000 ? (city.listeners / 1000).toFixed(0) + 'K' : city.listeners;
  ctx.fillText('♫ ' + listeners, textX, imgY + 58, textW);
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

function getBeamHeight(listeners) {
  const minL = 40000;
  const maxL = 140000;
  const t = Math.min(1, Math.max(0, (listeners - minL) / (maxL - minL)));
  return BEAM_MIN_HEIGHT + t * (BEAM_MAX_HEIGHT - BEAM_MIN_HEIGHT);
}

function createBeamMesh(surfacePos, direction, height, color, phase) {
  const group = new THREE.Group();

  const beamH = height;
  const beamW = BEAM_WIDTH;

  const uniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color.hex) },
    uPhase: { value: phase },
    uWispDensity: { value: _beamConfig.wispDensity },
    uWispSpeed: { value: _beamConfig.wispSpeed },
    uWispIntensity: { value: _beamConfig.wispIntensity },
    uFlowSpeed: { value: _beamConfig.flowSpeed },
    uFlowStrength: { value: _beamConfig.flowStrength },
    uFogIntensity: { value: _beamConfig.fogIntensity },
    uFogScale: { value: _beamConfig.fogScale },
    uFogFallSpeed: { value: _beamConfig.fogFallSpeed },
    uDecay: { value: _beamConfig.decay },
    uFalloffStart: { value: _beamConfig.falloffStart }
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: beamVertexShader,
    fragmentShader: beamFragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });

  const geometry = new THREE.PlaneGeometry(beamW, beamH, 1, 32);
  geometry.translate(0, beamH / 2, 0);

  const frontPlane = new THREE.Mesh(geometry, material);
  group.add(frontPlane);

  const sideGeo = new THREE.PlaneGeometry(beamW, beamH, 1, 32);
  sideGeo.translate(0, beamH / 2, 0);
  sideGeo.rotateY(Math.PI / 2);

  const sideMat = new THREE.ShaderMaterial({
    vertexShader: beamVertexShader,
    fragmentShader: beamFragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });

  const sidePlane = new THREE.Mesh(sideGeo, sideMat);
  group.add(sidePlane);

  group.position.copy(surfacePos);

  const up = direction.clone();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
  group.quaternion.copy(quat);

  return { group, materials: [material, sideMat], uniforms };
}

export function updateBeams(beams, globalTime, camera) {
  beams.forEach(({ materials }) => {
    materials.forEach(mat => {
      if (mat.uniforms && mat.uniforms.uTime) {
        mat.uniforms.uTime.value = globalTime;
      }
    });
  });
}

export function updateLabels(labels, camera) {
}

export function getBeamConfig() {
  return { ..._beamConfig, beamWidth: BEAM_WIDTH, beamMinH: BEAM_MIN_HEIGHT, beamMaxH: BEAM_MAX_HEIGHT };
}

export function createBeams(earthGroup, camera) {
  const beams = [];
  const labels = [];
  const beamGroup = new THREE.Group();
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';

  CITY_DATA.forEach((city, cityIndex) => {
    const color = getCityColor(city.region);
    const height = getBeamHeight(city.listeners);
    const phase = Math.random() * Math.PI * 2;

    const surfacePos = latLngToVector3(city.lat, city.lng, EARTH_RADIUS);
    const direction = surfacePos.clone().normalize();

    const { group, materials, uniforms } = createBeamMesh(surfacePos, direction, height, color, phase);
    beamGroup.add(group);

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
    const labelPos = surfacePos.clone().add(direction.clone().multiplyScalar(height));
    label.position.copy(labelPos);
    label.scale.set(LABEL_SIZE, LABEL_SIZE / 1.6, 1);
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

    beams.push({ group, materials, uniforms, city, phase, height, direction, surfacePos });
  });

  earthGroup.add(beamGroup);
  return { beamGroup, beams, labels };
}
