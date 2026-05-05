import { CITY_DATA } from './cities.js';

let currentData = [...CITY_DATA];
let listeners = [];

function generateUpdate() {
  return currentData.map(city => ({
    ...city,
    listeners: city.listeners + Math.floor((Math.random() - 0.5) * city.listeners * 0.02)
  }));
}

export function getData() {
  return currentData;
}

export function updateData() {
  currentData = generateUpdate();
  listeners.forEach(cb => cb(currentData));
}

export function onDataUpdate(callback) {
  listeners.push(callback);
}

export function removeDataListener(callback) {
  listeners = listeners.filter(cb => cb !== callback);
}

export function connectWebSocket(url) {
  try {
    const ws = new WebSocket(url);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          currentData = data;
          listeners.forEach(cb => cb(currentData));
        }
      } catch (e) {
        console.warn('WebSocket data parse error:', e);
      }
    };
    ws.onerror = () => console.warn('WebSocket connection error');
    ws.onclose = () => console.warn('WebSocket connection closed');
    return ws;
  } catch (e) {
    console.warn('WebSocket not available, using simulated data');
    return null;
  }
}

setInterval(updateData, 5000);
