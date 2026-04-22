import axios from 'axios';

const BASE_URL = 'https://arcdata.mahcks.com/v1';

export async function fetchArcItems() {
  try {
    const response = await axios.get(`${BASE_URL}/items?full=true`);
    return response.data;
  } catch (error: any) {
    console.error(`[ArcData] Items API error: ${error.message}`);
    return [];
  }
}

export async function fetchArcBots() {
  try {
    const response = await axios.get(`${BASE_URL}/bots`);
    return response.data;
  } catch (error: any) {
    console.error(`[ArcData] Bots API error: ${error.message}`);
    return [];
  }
}

export async function fetchArcEvents() {
  try {
    const response = await axios.get(`${BASE_URL}/map-events`);
    return response.data;
  } catch (error: any) {
    console.error(`[ArcData] Events API error: ${error.message}`);
    return [];
  }
}

export async function fetchArcMaps() {
  try {
    const response = await axios.get(`${BASE_URL}/maps`);
    return response.data;
  } catch (error: any) {
    console.error(`[ArcData] Maps API error: ${error.message}`);
    return [];
  }
}
