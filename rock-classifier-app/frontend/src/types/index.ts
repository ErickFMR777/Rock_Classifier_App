export interface RockInfo {
  class: string;
  confidence: number;
  type?: string;
  color?: string;
  grain_size?: string;
  mineral_composition?: string[];
  formation?: string[];
  uses?: string[];
  description?: string;
}

export interface AlternativeMatch {
  class: string;
  confidence: number;
}

/** Response of POST /api/classify/rock */
export interface ClassificationResult {
  primary: RockInfo;
  alternatives: AlternativeMatch[];
  inference_time_ms: number;
}

export interface Rock {
  id: number;
  name: string;
  type: string;
  color: string;
  grain_size: string;
  description: string;
}

/** Response of GET /api/reference/rocks */
export interface RocksListResponse {
  rocks: Rock[];
  total: number;
}

/** Response of GET /api/model/metrics — shape depends on the training run. */
export interface ModelMetrics {
  classification_report?: Record<
    string,
    { precision: number; recall: number; 'f1-score': number; support: number }
  >;
  [key: string]: unknown;
}
