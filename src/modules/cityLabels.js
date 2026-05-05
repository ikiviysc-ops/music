import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CITY_DATA, getCityColor } from '../data/cities.js';
import { latLngToVector3 } from '../utils/geo.js';

const EARTH_RADIUS = 5;
const MAX_LABELS_MOBILE = 6;

const labelStyles = `
  .city-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    pointer-events: auto;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }
  .city-label:hover {
    background: rgba(255,255,255,0.15);
    border-color: rgba(255,255,255,0.25);
    transform: scale(1.05);
  }
  .city-label-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }
  .city-label-name {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    line-height: 1.2;
  }
  .city-label-listeners {
    font-size: 11px;
    color: rgba(255,255,255,0.55);
    line-height: 1.2;
  }
`;

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

function createCityLabelElement(city) {
  const color = getCityColor(city.region);
  const div = document.createElement('div');
  div.className = 'city-label';
  div.innerHTML = `
    <div class="city-label-icon" style="background:${color.hex}22;border:1px solid ${color.hex}44;">
      <span style="color:${color.hex};">&#9835;</span>
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
  const maxLabels = isMobile ? MAX_LABELS_MOBILE : CITY_DATA.length;
  const sortedCities = [...CITY_DATA].sort((a, b) => b.listeners - a.listeners);
  const labels = [];

  sortedCities.slice(0, maxLabels).forEach(city => {
    const div = createCityLabelElement(city);
    const label = new CSS2DObject(div);
    const pos = latLngToVector3(city.lat, city.lng, EARTH_RADIUS + 0.5);
    label.position.copy(pos);
    label.userData = { city };
    scene.add(label);
    labels.push(label);
  });

  return labels;
}
