import axios from 'axios';
import { ClassificationResult } from '../types';

// Usa VITE_API_URL para producción y desarrollo remoto. Si no está definida, asume /api (solo para desarrollo local).
const API_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});


// Permite usar /predict o /classify/rock según disponibilidad del backend
export async function classifyRock(file: File): Promise<ClassificationResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Intenta primero /predict (nuevo endpoint)
    const response = await client.post<ClassificationResult>(
      '/predict',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (err) {
    // Si falla, usa el endpoint antiguo para compatibilidad
    const response = await client.post<ClassificationResult>(
      '/classify/rock',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
}

export async function getRocks() {
  const response = await client.get('/reference/rocks');
  return response.data;
}

export async function getRockDetails(rockName: string) {
  const response = await client.get(`/reference/rocks/${encodeURIComponent(rockName)}`);
  return response.data;
}

export async function healthCheck() {
  const response = await client.get('/health');
  return response.data;
}

export default client;
