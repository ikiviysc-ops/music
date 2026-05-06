export const CITY_DATA = [
  { city: '东京', cityEn: 'Tokyo', lat: 35.6, lng: 139.6, listeners: 120000, region: 'asia', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=80&h=80&fit=crop' },
  { city: '首尔', cityEn: 'Seoul', lat: 37.5, lng: 127.0, listeners: 95000, region: 'asia', img: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=80&h=80&fit=crop' },
  { city: '上海', cityEn: 'Shanghai', lat: 31.2, lng: 121.5, listeners: 110000, region: 'asia', img: 'https://images.unsplash.com/photo-1537531383496-7d3426c0b5d4?w=80&h=80&fit=crop' },
  { city: '北京', cityEn: 'Beijing', lat: 39.9, lng: 116.4, listeners: 105000, region: 'asia', img: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=80&h=80&fit=crop' },
  { city: '新加坡', cityEn: 'Singapore', lat: 1.3, lng: 103.8, listeners: 65000, region: 'asia', img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=80&h=80&fit=crop' },
  { city: '孟买', cityEn: 'Mumbai', lat: 19.0, lng: 72.8, listeners: 78000, region: 'asia', img: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=80&h=80&fit=crop' },
  { city: '伦敦', cityEn: 'London', lat: 51.5, lng: -0.1, listeners: 98000, region: 'europe', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=80&h=80&fit=crop' },
  { city: '巴黎', cityEn: 'Paris', lat: 48.8, lng: 2.3, listeners: 87000, region: 'europe', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=80&h=80&fit=crop' },
  { city: '柏林', cityEn: 'Berlin', lat: 52.5, lng: 13.4, listeners: 72000, region: 'europe', img: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=80&h=80&fit=crop' },
  { city: '莫斯科', cityEn: 'Moscow', lat: 55.7, lng: 37.6, listeners: 68000, region: 'europe', img: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=80&h=80&fit=crop' },
  { city: '纽约', cityEn: 'New York', lat: 40.7, lng: -74.0, listeners: 130000, region: 'americas', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=80&h=80&fit=crop' },
  { city: '洛杉矶', cityEn: 'Los Angeles', lat: 34.0, lng: -118.2, listeners: 115000, region: 'americas', img: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=80&h=80&fit=crop' },
  { city: '圣保罗', cityEn: 'São Paulo', lat: -23.5, lng: -46.6, listeners: 89000, region: 'americas', img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=80&h=80&fit=crop' },
  { city: '墨西哥城', cityEn: 'Mexico City', lat: 19.4, lng: -99.1, listeners: 62000, region: 'americas', img: 'https://images.unsplash.com/photo-1576997711848-6b6315a7f4e0?w=80&h=80&fit=crop' },
  { city: '开普敦', cityEn: 'Cape Town', lat: -33.9, lng: 18.4, listeners: 45000, region: 'africa', img: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=80&h=80&fit=crop' },
  { city: '拉各斯', cityEn: 'Lagos', lat: 6.5, lng: 3.4, listeners: 52000, region: 'africa', img: 'https://images.unsplash.com/photo-1520803906546-10f29b094905?w=80&h=80&fit=crop' },
  { city: '悉尼', cityEn: 'Sydney', lat: -33.8, lng: 151.2, listeners: 71000, region: 'oceania', img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=80&h=80&fit=crop' },
  { city: '迪拜', cityEn: 'Dubai', lat: 25.2, lng: 55.3, listeners: 58000, region: 'asia', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=80&h=80&fit=crop' }
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
