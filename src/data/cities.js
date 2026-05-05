export const CITY_DATA = [
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

export const REGION_COLORS = {
  asia: { hex: '#7C3AED', r: 0.486, g: 0.227, b: 0.929 },
  europe: { hex: '#00D1FF', r: 0.0, g: 0.820, b: 1.0 },
  americas: { hex: '#FF6B9D', r: 1.0, g: 0.420, b: 0.616 },
  africa: { hex: '#FF9F43', r: 1.0, g: 0.624, b: 0.263 },
  oceania: { hex: '#00FFA3', r: 0.0, g: 1.0, b: 0.639 }
};

export function getCityColor(region) {
  return REGION_COLORS[region] || REGION_COLORS.asia;
}
