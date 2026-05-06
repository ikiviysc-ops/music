export const CITY_DATA = [
  { city: '东京', cityEn: 'Tokyo', lat: 35.6, lng: 139.6, listeners: 120000, region: 'asia', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Tokyo%20cityscape%20night%20neon%20lights&image_size=square' },
  { city: '首尔', cityEn: 'Seoul', lat: 37.5, lng: 127.0, listeners: 95000, region: 'asia', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Seoul%20cityscape%20night&image_size=square' },
  { city: '上海', cityEn: 'Shanghai', lat: 31.2, lng: 121.5, listeners: 110000, region: 'asia', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Shanghai%20skyline%20night%20lights&image_size=square' },
  { city: '北京', cityEn: 'Beijing', lat: 39.9, lng: 116.4, listeners: 105000, region: 'asia', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Beijing%20forbidden%20city%20night&image_size=square' },
  { city: '新加坡', cityEn: 'Singapore', lat: 1.3, lng: 103.8, listeners: 65000, region: 'asia', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Singapore%20marina%20bay%20night&image_size=square' },
  { city: '孟买', cityEn: 'Mumbai', lat: 19.0, lng: 72.8, listeners: 78000, region: 'asia', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mumbai%20gateway%20of%20india%20sunset&image_size=square' },
  { city: '伦敦', cityEn: 'London', lat: 51.5, lng: -0.1, listeners: 98000, region: 'europe', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=London%20big%20ben%20night&image_size=square' },
  { city: '巴黎', cityEn: 'Paris', lat: 48.8, lng: 2.3, listeners: 87000, region: 'europe', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Paris%20eiffel%20tower%20night&image_size=square' },
  { city: '柏林', cityEn: 'Berlin', lat: 52.5, lng: 13.4, listeners: 72000, region: 'europe', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Berlin%20brandenburg%20gate%20night&image_size=square' },
  { city: '莫斯科', cityEn: 'Moscow', lat: 55.7, lng: 37.6, listeners: 68000, region: 'europe', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Moscow%20kremlin%20night&image_size=square' },
  { city: '纽约', cityEn: 'New York', lat: 40.7, lng: -74.0, listeners: 130000, region: 'americas', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=New%20York%20manhattan%20skyline%20night&image_size=square' },
  { city: '洛杉矶', cityEn: 'Los Angeles', lat: 34.0, lng: -118.2, listeners: 115000, region: 'americas', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Los%20Angeles%20hollywood%20night&image_size=square' },
  { city: '圣保罗', cityEn: 'São Paulo', lat: -23.5, lng: -46.6, listeners: 89000, region: 'americas', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sao%20Paulo%20cityscape%20night&image_size=square' },
  { city: '墨西哥城', cityEn: 'Mexico City', lat: 19.4, lng: -99.1, listeners: 62000, region: 'americas', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mexico%20City%20cathedral%20night&image_size=square' },
  { city: '开普敦', cityEn: 'Cape Town', lat: -33.9, lng: 18.4, listeners: 45000, region: 'africa', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cape%20Town%20table%20mountain%20sunset&image_size=square' },
  { city: '拉各斯', cityEn: 'Lagos', lat: 6.5, lng: 3.4, listeners: 52000, region: 'africa', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Lagos%20cityscape%20sunset&image_size=square' },
  { city: '悉尼', cityEn: 'Sydney', lat: -33.8, lng: 151.2, listeners: 71000, region: 'oceania', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sydney%20opera%20house%20night&image_size=square' },
  { city: '迪拜', cityEn: 'Dubai', lat: 25.2, lng: 55.3, listeners: 58000, region: 'asia', img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Dubai%20burj%20khalifa%20night&image_size=square' }
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
