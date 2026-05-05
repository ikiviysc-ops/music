import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const BLOOM_CONFIG = {
  strength: 1.8,
  radius: 0.6,
  threshold: 0.25,
  mobileStrength: 1.2,
  mobileRadius: 0.4
};

const vignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uIntensity: { value: 0.4 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float dist = distance(vUv, vec2(0.5));
      float vignette = smoothstep(0.5, 0.8, dist);
      color.rgb *= 1.0 - vignette * uIntensity;
      gl_FragColor = color;
    }
  `
};

export function createComposer(renderer, scene, camera) {
  const isMobile = window.innerWidth <= 480;
  const isLowEnd = navigator.hardwareConcurrency < 4;

  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  if (!isLowEnd) {
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      isMobile ? BLOOM_CONFIG.mobileStrength : BLOOM_CONFIG.strength,
      isMobile ? BLOOM_CONFIG.mobileRadius : BLOOM_CONFIG.radius,
      BLOOM_CONFIG.threshold
    );
    composer.addPass(bloomPass);
  }

  const vignettePass = new ShaderPass(vignetteShader);
  composer.addPass(vignettePass);

  return composer;
}

export function updateComposerSize(composer, container) {
  composer.setSize(container.clientWidth, container.clientHeight);
}
