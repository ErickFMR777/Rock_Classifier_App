import axios from 'axios';
import { ClassificationResult } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

export async function classifyRock(file: File): Promise<ClassificationResult> {
  const formData = new FormData();
  formData.append('file', file);

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
