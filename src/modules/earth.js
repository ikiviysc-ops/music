import ThreeGlobe from 'three-globe';
import * as THREE from 'three';

const ROTATION_SPEED = 0.0003;
const GLOBE_RADIUS = 100;

const ARC_CONNECTIONS = [
  [0, 10], [0, 6], [1, 10], [2, 0], [3, 2],
  [4, 7], [5, 16], [6, 7], [7, 8], [8, 9],
  [10, 11], [10, 12], [11, 12], [13, 11],
  [14, 5], [15, 14], [16, 4], [17, 5]
];

const CITY_DATA = [
  { city: '东京', lat: 35.6, lng: 139.6, listeners: 120000, region: 'asia' },
  { city: '首尔', lat: 37.5, lng: 127.0, listeners: 95000, region: 'asia' },
  { city: '上海', lat: 31.2, lng: 121.5, listeners: 110000, region: 'asia' },
  { city: '北京', lat: 39.9, lng: 116.4, listeners: 105000, region: 'asia' },
  { city: '新加坡', lat: 1.3, lng: 103.8, listeners: 65000, region: 'asia' },
  { city: '孟买', lat: 19.0, lng: 72.8, listeners: 78000, region: 'asia' },
  { city: '伦敦', lat: 51.5, lng: -0.1, listeners: 98000, region: 'europe' },
  { city: '巴黎', lat: 48.8, lng: 2.3, listeners: 87000, region: 'europe' },
  { city: '柏林', lat: 52.5, lng: 13.4, listeners: 72000, region: 'europe' },
  { city: '莫斯科', lat: 55.7, lng: 37.6, listeners: 68000, region: 'europe' },
  { city: '纽约', lat: 40.7, lng: -74.0, listeners: 130000, region: 'americas' },
  { city: '洛杉矶', lat: 34.0, lng: -118.2, listeners: 115000, region: 'americas' },
  { city: '圣保罗', lat: -23.5, lng: -46.6, listeners: 89000, region: 'americas' },
  { city: '墨西哥城', lat: 19.4, lng: -99.1, listeners: 62000, region: 'americas' },
  { city: '开普敦', lat: -33.9, lng: 18.4, listeners: 45000, region: 'africa' },
  { city: '拉各斯', lat: 6.5, lng: 3.4, listeners: 52000, region: 'africa' },
  { city: '悉尼', lat: -33.8, lng: 151.2, listeners: 71000, region: 'oceania' },
  { city: '迪拜', lat: 25.2, lng: 55.3, listeners: 58000, region: 'asia' }
];

const REGION_COLORS = {
  asia: '#7C3AED',
  europe: '#00D1FF',
  americas: '#FF6B9D',
  africa: '#FF9F43',
  oceania: '#00FFA3'
};

function getCityColor(region) {
  return REGION_COLORS[region] || REGION_COLORS.asia;
}

function buildArcData() {
  return ARC_CONNECTIONS.map(([fromIdx, toIdx]) => {
    const from = CITY_DATA[fromIdx];
    const to = CITY_DATA[toIdx];
    if (!from || !to) return null;
    return {
      startLat: from.lat,
      startLng: from.lng,
      endLat: to.lat,
      endLng: to.lng,
      color: [getCityColor(from.region), getCityColor(to.region)]
    };
  }).filter(Boolean);
}

export function createEarth() {
  const globe = new ThreeGlobe({
    waitForGlobeReady: true,
    animateIn: true
  })
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .showAtmosphere(true)
    .atmosphereColor('#1a6bff')
    .atmosphereAltitude(0.18)
    .showGraticules(false)
    .pointsData(CITY_DATA)
    .pointLat(d => d.lat)
    .pointLng(d => d.lng)
    .pointAltitude(d => Math.log(d.listeners + 1) * 0.003)
    .pointRadius(d => Math.log(d.listeners + 1) * 0.15)
    .pointColor(d => getCityColor(d.region))
    .pointsMerge(false)
    .arcsData(buildArcData())
    .arcStartLat(d => d.startLat)
    .arcStartLng(d => d.startLng)
    .arcEndLat(d => d.endLat)
    .arcEndLng(d => d.endLng)
    .arcColor(d => d.color)
    .arcStroke(1.2)
    .arcCurveResolution(64)
    .arcCircularResolution(6)
    .arcDashLength(0.4)
    .arcDashGap(0.2)
    .arcDashAnimateTime(2000 + Math.random() * 2000)
    .arcAltitude(0.15)
    .arcAltitudeAutoScale(0.3)
    .ringsData(CITY_DATA.slice(0, 8))
    .ringLat(d => d.lat)
    .ringLng(d => d.lng)
    .ringAltitude(0.01)
    .ringColor(d => t => `rgba(${hexToRgb(getCityColor(d.region))}, ${1 - t})`)
    .ringMaxRadius(d => Math.log(d.listeners + 1) * 0.3)
    .ringPropagationSpeed(2)
    .ringRepeatPeriod(1500)
    .labelsData(CITY_DATA.slice(0, 8))
    .labelLat(d => d.lat)
    .labelLng(d => d.lng)
    .labelText(d => d.city)
    .labelSize(d => Math.log(d.listeners + 1) * 0.3)
    .labelColor(d => getCityColor(d.region))
    .labelAltitude(0.01)
    .labelDotRadius(0.3)
    .labelIncludeDot(true)
    .labelDotOrientation('right');

  globe.rotation.y = -Math.PI / 2;
  globe.userData = { ROTATION_SPEED, GLOBE_RADIUS };

  return globe;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export function updateEarth(globe, deltaTime, elapsedTime) {
  globe.rotation.y += globe.userData.ROTATION_SPEED;
}
