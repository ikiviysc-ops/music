import * as THREE from 'three';

const EARTH_RADIUS = 2.0;
const ROTATION_SPEED = 0.0003;

function createAtmosphere() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.15, 64, 64);
  
  const atmosphereVertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  const atmosphereFragmentShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec3 viewDirection = normalize(-vPosition);
      float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.5);
      vec3 atmosphereColor = vec3(0.05, 0.2, 0.6);
      float intensity = fresnel * 0.8;
      gl_FragColor = vec4(atmosphereColor, intensity);
    }
  `;
  
  const material = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
  
  return new THREE.Mesh(geometry, material);
}

export function createEarth() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
  
  const loader = new THREE.TextureLoader();
  
  const textureUrl = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/90000/90008/earth_night_4k.jpg';
  
  const texture = loader.load(textureUrl);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: 0x112233,
    emissiveIntensity: 0.3,
    roughness: 0.7,
    metalness: 0.1
  });
  
  const earth = new THREE.Mesh(geometry, material);
  const atmosphere = createAtmosphere();
  
  const group = new THREE.Group();
  group.add(earth);
  group.add(atmosphere);
  
  group.userData = { earth, atmosphere, EARTH_RADIUS, ROTATION_SPEED };
  return group;
}

export function updateEarth(earthGroup, deltaTime, elapsedTime) {
  const { earth, atmosphere, ROTATION_SPEED: speed } = earthGroup.userData;
  earth.rotation.y += speed;
}
