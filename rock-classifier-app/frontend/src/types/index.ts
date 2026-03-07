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
