import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

const BLOOM_CONFIG = {
  strength: 2.0,
  radius: 0.5,
  threshold: 0.1
};

const VIGNETTE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uDarkness: { value: 0.35 },
    uOffset: { value: 1.0 }
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
    uniform float uDarkness;
    uniform float uOffset;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(uOffset);
      float vignette = 1.0 - dot(uv, uv);
      texel.rgb *= mix(1.0, vignette, uDarkness);
      gl_FragColor = texel;
    }
  `
};

export function createComposer(renderer, scene, camera) {
  const size = renderer.getSize(new THREE.Vector2());
  const pixelRatio = renderer.getPixelRatio();

  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(size.x, size.y),
    BLOOM_CONFIG.strength,
    BLOOM_CONFIG.radius,
    BLOOM_CONFIG.threshold
  );
  composer.addPass(bloomPass);

  const fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.uniforms['resolution'].value.set(
    1 / (size.x * pixelRatio),
    1 / (size.y * pixelRatio)
  );
  composer.addPass(fxaaPass);

  const vignettePass = new ShaderPass(VIGNETTE_SHADER);
  composer.addPass(vignettePass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return composer;
}

export function updateComposerSize(composer, container) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  composer.setSize(width, height);
  composer.setPixelRatio(pixelRatio);

  const passes = composer.passes;
  passes.forEach(pass => {
    if (pass.uniforms && pass.uniforms['resolution']) {
      pass.uniforms['resolution'].value.set(1 / (width * pixelRatio), 1 / (height * pixelRatio));
    }
  });
}
