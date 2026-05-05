import * as THREE from 'three';

const PARTICLE_COUNT = 600;
const GLOBE_RADIUS = 1.5;

const particleVertexShader = `
  attribute float aLife;
  attribute float aSpeed;
  attribute float aSize;
  attribute vec3 aVelocity;
  attribute float aDelay;

  uniform float uTime;

  varying float vLife;
  varying float vAlpha;

  void main() {
    float t = mod(uTime * aSpeed + aDelay, 1.0);
    vLife = t;

    float fadeIn = smoothstep(0.0, 0.15, t);
    float fadeOut = smoothstep(1.0, 0.7, t);
    vAlpha = fadeIn * fadeOut;

    vec3 pos = position + aVelocity * t * 1.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = max(0.5, aSize * (40.0 / -mvPosition.z) * vAlpha);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;

  varying float vLife;
  varying float vAlpha;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float glow = 1.0 - dist * 2.0;
    glow = pow(glow, 2.5);

    float trailFade = smoothstep(0.0, 0.2, vLife) * smoothstep(1.0, 0.6, vLife);

    vec3 color = uColor * (0.8 + 0.2 * sin(uTime * 2.0 + vLife * 6.28));
    float alpha = glow * vAlpha * trailFade * 0.2;

    gl_FragColor = vec4(color, alpha);
  }
`;

export function createParticles(scene) {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const lives = new Float32Array(PARTICLE_COUNT);
  const speeds = new Float32Array(PARTICLE_COUNT);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const delays = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const radius = GLOBE_RADIUS + 0.3 + Math.random() * 0.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const dir = new THREE.Vector3(
      positions[i * 3],
      positions[i * 3 + 1],
      positions[i * 3 + 2]
    ).normalize();

    velocities[i * 3] = dir.x * 0.04 + (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = dir.y * 0.04 + (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 2] = dir.z * 0.04 + (Math.random() - 0.5) * 0.02;

    lives[i] = Math.random();
    speeds[i] = 0.15 + Math.random() * 0.35;
    sizes[i] = 0.3 + Math.random() * 0.7;
    delays[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('aLife', new THREE.BufferAttribute(lives, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0x4488ff) }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  return { particles, material };
}

export function updateParticles(particleData, elapsed, delta) {
  if (particleData && particleData.material && particleData.material.uniforms) {
    particleData.material.uniforms.uTime.value = elapsed;
  }
}
