import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CITY_DATA, getCityColor } from '../data/cities.js';
import { latLngToVector3 } from '../utils/geo.js';

const EARTH_RADIUS = 3.5;
const MAX_LABELS_MOBILE = 5;
const MAX_LABELS_DESKTOP = 8;

const labelStyles = `
  .city-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    pointer-events: auto;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }
  .city-label:hover {
    background: rgba(0, 0, 0, 0.5);
    transform: scale(1.05);
  }
  .city-label-icon {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: linear-gradient(135deg, #7C3AED, #00D1FF);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }
  .city-label-name {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    line-height: 1.2;
  }
  .city-label-listeners {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.2;
  }
`;

const coverImages = [
  'https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484755560615-5af6926427a1?q=80&w=200&auto=format&fit=crop',
];

let styleInjected = false;

function injectStyles() {
  if (styleInjected) return;
  const style = document.createElement('style');
  style.textContent = labelStyles;
  document.head.appendChild(style);
  styleInjected = true;
}

export function createLabelRenderer(container) {
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(container.clientWidth, container.clientHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  labelRenderer.domElement.style.zIndex = '2';
  container.appendChild(labelRenderer.domElement);

  injectStyles();

  return labelRenderer;
}

export function updateLabelRendererSize(labelRenderer, container) {
  labelRenderer.setSize(container.clientWidth, container.clientHeight);
}

function createCityLabelElement(city, index) {
  const color = getCityColor(city.region);
  const coverImage = coverImages[index % coverImages.length];
  const div = document.createElement('div');
  div.className = 'city-label';
  div.innerHTML = `
    <div class="city-label-icon">
      <img src="${coverImage}" style="width:100%;height:100%;object-fit:cover;" alt="">
    </div>
    <div>
      <div class="city-label-name">${city.city}</div>
      <div class="city-label-listeners">${city.listeners.toLocaleString()}人在听</div>
    </div>
  `;
  return div;
}

export function createCityLabels(scene) {
  const isMobile = window.innerWidth <= 480;
  const maxLabels = isMobile ? MAX_LABELS_MOBILE : MAX_LABELS_DESKTOP;
  
  // 只取音乐热度最高的城市
  const sortedCities = [...CITY_DATA]
    .sort((a, b) => b.listeners - a.listeners)
    .slice(0, maxLabels);
  
  const labels = [];

  sortedCities.forEach((city, index) => {
    const div = createCityLabelElement(city, index);
    const label = new CSS2DObject(div);
    const pos = latLngToVector3(city.lat, city.lng, EARTH_RADIUS + 0.6);
    label.position.copy(pos);
    label.userData = { city };
    scene.add(label);
    labels.push(label);
  });

  return labels;
}
