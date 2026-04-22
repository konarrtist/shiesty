import axios from 'axios';

export async function fetchArdb(endpoint: string, id?: string) {
  const path = id ? `${endpoint}/${id}` : endpoint;
  try {
    const response = await axios.get(`https://ardb.app/api/${path}`);
    return response.data;
  } catch (error: any) {
    console.error(`[ARDB] API error: ${error.message}`);
    throw error;
  }
}
