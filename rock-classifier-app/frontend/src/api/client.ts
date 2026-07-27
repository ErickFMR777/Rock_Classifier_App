import axios, { AxiosError } from 'axios';
import { ClassificationResult, RocksListResponse, ModelMetrics } from '../types';

/**
 * Resolves the backend base URL.
 *
 * Production (Vercel): `VITE_API_URL` must point at the deployed FastAPI service.
 * PyTorch cannot run on Vercel's serverless functions (the torch wheel alone
 * exceeds the 250 MB limit), so the API is always hosted elsewhere.
 *
 * Development: falls back to `/api`, which Vite proxies to http://localhost:8000.
 */
function resolveApiBase(): string | null {
  const raw = import.meta.env.VITE_API_URL?.trim();

  if (raw) {
    // Accept both `https://host` and `https://host/api` — every backend route
    // is mounted under `/api`, so normalise to exactly one `/api` suffix.
    const withoutTrailingSlash = raw.replace(/\/+$/, '');
    return withoutTrailingSlash.endsWith('/api')
      ? withoutTrailingSlash
      : `${withoutTrailingSlash}/api`;
  }

  return import.meta.env.DEV ? '/api' : null;
}

export const API_BASE = resolveApiBase();

/** False on a Vercel deploy where VITE_API_URL was never set. */
export const isApiConfigured = API_BASE !== null;

const client = axios.create({
  baseURL: API_BASE ?? undefined,
  timeout: 60000,
});

class ApiNotConfiguredError extends Error {
  constructor() {
    super(
      'The classification backend is not configured. Set VITE_API_URL to your deployed FastAPI service and redeploy.'
    );
    this.name = 'ApiNotConfiguredError';
  }
}

/** Turns axios failures into messages that are useful to a user, not a stack trace. */
function toFriendlyError(err: unknown): Error {
  if (!(err instanceof AxiosError)) {
    return err instanceof Error ? err : new Error('Unexpected error during classification.');
  }

  if (err.code === 'ECONNABORTED') {
    return new Error('The request timed out. The backend may be waking up from sleep — try again in a moment.');
  }

  if (!err.response) {
    return new Error('Could not reach the classification backend. Check that it is running and that CORS allows this domain.');
  }

  const { status, data } = err.response;
  const detail = typeof data === 'object' && data !== null ? (data as { detail?: unknown }).detail : undefined;

  if (typeof detail === 'string' && detail.length > 0) {
    return new Error(detail);
  }

  if (status === 429) {
    return new Error('Rate limit reached (30 requests/minute). Please wait a moment and try again.');
  }

  return new Error(`Classification failed with status ${status}.`);
}

/**
 * Classify a rock image.
 * Matches the backend contract: POST /api/classify/rock -> ClassificationResponse.
 */
export async function classifyRock(file: File): Promise<ClassificationResult> {
  if (!isApiConfigured) {
    throw new ApiNotConfiguredError();
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await client.post<ClassificationResult>('/classify/rock', formData);
    return response.data;
  } catch (err) {
    throw toFriendlyError(err);
  }
}

export async function getRocks(): Promise<RocksListResponse> {
  const response = await client.get<RocksListResponse>('/reference/rocks');
  return response.data;
}

export async function getRockDetails(rockName: string) {
  const response = await client.get(`/reference/rocks/${encodeURIComponent(rockName)}`);
  return response.data;
}

/**
 * Training metrics published by the backend. Optional: the About page falls back
 * to the metrics bundled at build time when this is unavailable.
 */
export async function getModelMetrics(): Promise<ModelMetrics | null> {
  if (!isApiConfigured) return null;

  try {
    const response = await client.get<ModelMetrics>('/model/metrics');
    return response.data;
  } catch {
    return null;
  }
}

export async function healthCheck() {
  const response = await client.get('/health');
  return response.data;
}

export default client;
