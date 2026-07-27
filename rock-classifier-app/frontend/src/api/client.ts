import axios, { AxiosError } from 'axios';
import { ClassificationResult, RocksListResponse, ModelMetrics } from '../types';

/**
 * Resolves the API base URL.
 *
 * Default is the same origin (`/api`): inference ships with the frontend as
 * Vercel Python functions running onnxruntime, so there is no second service to
 * point at. In development Vite proxies `/api` to a local uvicorn instead.
 *
 * `VITE_API_URL` remains supported as an override for pointing at a separately
 * hosted FastAPI backend; both `https://host` and `https://host/api` are accepted.
 */
function resolveApiBase(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) return '/api';

  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  return withoutTrailingSlash.endsWith('/api')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
}

export const API_BASE = resolveApiBase();

/**
 * The API is always reachable now that it is same-origin. Kept as a named
 * export so callers read intent rather than a bare `true`.
 */
export const isApiConfigured = true;

const client = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

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
