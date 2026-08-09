import axios from 'axios';
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

/**
 * What went wrong, as a stable identifier rather than a sentence.
 *
 * The API answers in English (its `detail` strings are not localised), and this
 * module cannot call a React hook to translate. So failures are classified here
 * and the wording is chosen by the component that renders them, which does know
 * the active locale.
 */
export type ApiErrorKind =
  | 'timeout'
  | 'network'
  | 'rateLimit'
  | 'tooLarge'
  | 'badType'
  | 'badImage'
  | 'noFile'
  | 'server'
  | 'unexpected';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** Raw English `detail` from the API, kept for logs — not for display. */
  readonly detail?: string;
  readonly status?: number;

  constructor(kind: ApiErrorKind, detail?: string, status?: number) {
    super(detail ?? kind);
    this.name = 'ApiError';
    this.kind = kind;
    this.detail = detail;
    this.status = status;
  }
}

/**
 * Classifies an axios failure into an {@link ApiErrorKind}.
 *
 * Uses `axios.isAxiosError` rather than `instanceof AxiosError`: `instanceof`
 * silently fails when two copies of axios end up in the bundle, and the whole
 * mapping below would then collapse to 'unexpected'.
 */
function toApiError(err: unknown): ApiError {
  if (!axios.isAxiosError(err)) {
    return new ApiError('unexpected', err instanceof Error ? err.message : undefined);
  }

  if (err.code === 'ECONNABORTED') return new ApiError('timeout');
  if (!err.response) return new ApiError('network');

  const { status, data } = err.response;
  const raw = typeof data === 'object' && data !== null ? (data as { detail?: unknown }).detail : undefined;
  const detail = typeof raw === 'string' ? raw : undefined;

  if (status === 429) return new ApiError('rateLimit', detail, status);
  if (status === 413) return new ApiError('tooLarge', detail, status);

  if (status === 400 && detail) {
    if (detail.includes('Invalid file type')) return new ApiError('badType', detail, status);
    if (detail.includes('Invalid image')) return new ApiError('badImage', detail, status);
    if (detail.includes('No file uploaded') || detail.includes('Empty request body')) {
      return new ApiError('noFile', detail, status);
    }
  }

  return new ApiError('server', detail, status);
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
    throw toApiError(err);
  }
}

export async function getRocks(): Promise<RocksListResponse> {
  const response = await client.get<RocksListResponse>('/reference/rocks');
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
