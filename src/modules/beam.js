import * as THREE from 'three';
import { latLngToVector3 } from '../utils/geo.js';
import { CITY_DATA, getCityColor } from '../data/cities.js';

const EARTH_RADIUS = 1.9;
const MIN_HEIGHT = 0.22;
const MAX_HEIGHT = 0.42;

function createNoiseTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 3; i++) {
    const scale = Math.pow(2, i);
    const opacity = 1 / (scale * 1.5);
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    for (let j = 0; j < data.length; j += 4) {
      const val = Math.random() * 255;
      data[j] = val;
      data[j + 1] = val;
      data[j + 2] = val;
      data[j + 3] = 255 * opacity;
    }
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(tempCanvas, 0, 0, size / scale, size / scale, 0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.generateMipmaps = true;
  return tex;
}

const noiseMap = createNoiseTexture(256);

const beamVertexShader = `
  uniform vec3 uCameraPos;
  uniform float uLength;

  varying vec2 vUv;
  varying float vZAxisFade;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;

    vec4 modelPos = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vWorldPos = modelPos.xyz;

    vec3 localAxis = normalize(mat3(modelMatrix) * vec3(0.0, 1.0, 0.0));
    vec3 toCamera = normalize(uCameraPos - modelPos.xyz);
    vec3 newRight = normalize(cross(toCamera, localAxis));

    float scaleX = length(modelMatrix[0].xyz);
    float scaleY = uLength;
    float t = position.y + 0.5;
    vec3 finalPos = modelPos.xyz
      + (newRight * position.x * scaleX)
      + (localAxis * t * scaleY);

    float dotView = abs(dot(toCamera, localAxis));
    vZAxisFade = 1.0 - smoothstep(0.92, 0.98, dotView);

    gl_Position = projectionMatrix * viewMatrix * vec4(finalPos, 1.0);
  }
`;

const beamFragmentShader = `
  uniform vec3 uColor;
  uniform float uConeStartWidth;
  uniform float uConeCurve;
  uniform float uBeamSharpness;
  uniform float uBeamFade;
  uniform float uPulsePhase;
  uniform float uPulseSpeed;
  uniform float uSurgePhase;
  uniform float uIntensity;

  uniform sampler2D uNoiseTexture;
  uniform float uNoiseScale;
  uniform float uNoiseIntensity;
  uniform vec2 uNoiseScrollSpeed;
  uniform float uNoiseDistortionIntensity;
  uniform vec2 uNoiseDistortionScrollSpeed;
  uniform float uTime;

  varying vec2 vUv;
  varying float vZAxisFade;
  varying vec3 vWorldPos;

  void main() {
    float cone_progress = pow(vUv.y, 1.0 - uConeCurve);
    float width = mix(uConeStartWidth, 1.0, cone_progress);
    float half_width = width * 0.5;

    float dist_x = abs(vUv.x - 0.5);
    float beam_edge_start = half_width - (half_width * (1.0 - uBeamSharpness));
    float horiz_mask = 1.0 - smoothstep(beam_edge_start, half_width, dist_x);

    float vert_mask = pow(vUv.y, uBeamFade);
    vert_mask *= smoothstep(0.0, uConeStartWidth * 0.5, 1.0 - vUv.y);
    vert_mask *= smoothstep(0.0, 0.1, vUv.y);

    vec2 worldOffset = vWorldPos.xz * 0.5 + vWorldPos.y * 0.1;
    vec2 distortionOffset = uNoiseDistortionScrollSpeed * uTime;
    vec2 noiseUV = (vUv * uNoiseScale) + worldOffset;
    vec2 distSample = texture2D(uNoiseTexture, noiseUV + distortionOffset).rg;
    vec2 distortedUV = vUv + (distSample - 0.5) * 2.0 * uNoiseDistortionIntensity;

    vec2 scroll1 = uNoiseScrollSpeed * uTime;
    vec2 scroll2 = vec2(-uNoiseScrollSpeed.x * 0.7, uNoiseScrollSpeed.y * 1.3) * uTime;
    float n1 = texture2D(uNoiseTexture, distortedUV * uNoiseScale + scroll1 + worldOffset).r;
    float n2 = texture2D(uNoiseTexture, distortedUV * uNoiseScale + scroll2 + worldOffset).r;
    float combinedNoise = mix(1.0, n1 * n2, 1.0 - vert_mask);
    horiz_mask *= mix(1.0, combinedNoise, uNoiseIntensity);

    float breath = 0.75 + 0.25 * sin(uTime * uPulseSpeed + uPulsePhase);
    float surge = pow(max(0.0, sin(uTime * 2.5 + uSurgePhase)), 10.0);
    float surgeY = fract(uTime * 0.8 + uSurgePhase * 0.2);
    float surgeMask = smoothstep(surgeY - 0.12, surgeY, vUv.y) * (1.0 - smoothstep(surgeY, surgeY + 0.12, vUv.y));
    float surgeEffect = surge * surgeMask;

    float alpha = horiz_mask * vert_mask * vZAxisFade;
    alpha *= breath;
    alpha += surgeEffect * 0.4;
    alpha *= uIntensity;

    vec3 col = uColor * (0.7 + 0.5 * vUv.y);
    col += uColor * surgeEffect * 1.2;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

function getBeamHeight(listeners) {
  const minL = 40000;
  const maxL = 140000;
  const t = Math.min(1, Math.max(0, (listeners - minL) / (maxL - minL)));
  return MIN_HEIGHT + t * (MAX_HEIGHT - MIN_HEIGHT);
}

export function createBeams(earthGroup, camera) {
  const beams = [];
  const beamGroup = new THREE.Group();

  const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

  CITY_DATA.forEach((city) => {
    const color = getCityColor(city.region);
    const height = getBeamHeight(city.listeners);
    const phase = Math.random() * Math.PI * 2;
    const surgePhase = Math.random() * Math.PI * 2;
    const intensity = 0.6 + (city.listeners / 140000) * 0.4;
    const widthScale = 0.012 + (city.listeners / 140000) * 0.008;

    const material = new THREE.ShaderMaterial({
      vertexShader: beamVertexShader,
      fragmentShader: beamFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(color.hex) },
        uConeStartWidth: { value: 0.01 },
        uConeCurve: { value: 0.6 },
        uBeamSharpness: { value: 0.5 },
        uBeamFade: { value: 1.5 },
        uPulsePhase: { value: phase },
        uPulseSpeed: { value: 1.5 + Math.random() * 0.5 },
        uSurgePhase: { value: surgePhase },
        uIntensity: { value: intensity },
        uLength: { value: height },
        uCameraPos: { value: new THREE.Vector3() },
        uNoiseTexture: { value: noiseMap },
        uNoiseScale: { value: 2.5 },
        uNoiseIntensity: { value: 0.6 },
        uNoiseScrollSpeed: { value: new THREE.Vector2(0.0, 0.8) },
        uNoiseDistortionIntensity: { value: 0.08 },
        uNoiseDistortionScrollSpeed: { value: new THREE.Vector2(0.1, 0.3) },
        uTime: { value: 0 }
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
    beam.scale.set(widthScale, 1, 1);

    beam.userData = { city, baseHeight: height, phase, colorHex: color.hex };
    beamGroup.add(beam);
    beams.push(beam);
  });

  earthGroup.add(beamGroup);
  return { beamGroup, beams };
}

export function updateBeams(beams, globalTime, camera) {
  const camPos = camera ? camera.position : new THREE.Vector3();
  beams.forEach(beam => {
    if (beam.material.uniforms) {
      beam.material.uniforms.uTime.value = globalTime;
      beam.material.uniforms.uCameraPos.value.copy(camPos);
    }
  });
}
