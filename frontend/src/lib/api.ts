import { normalizePredictionResult, type PredictionResult } from './forensics';

export interface HealthResponse {
  ok: boolean;
  modelRunning?: boolean;
  modelDetails?: {
    modelFilename?: string;
    modelDisplayName?: string;
    architecture?: string;
    threshold?: number;
    device?: string;
    modelLoaded?: boolean;
    metadata?: Record<string, any>;
  } | null;
  resnetRunning?: boolean;
  resnetDetails?: any;
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { ok: false, modelRunning: false, resnetRunning: false };
    }
    const data = await res.json();
    const isRunning = Boolean(data.modelRunning ?? data.resnetRunning ?? data.ok);
    return {
      ...data,
      ok: Boolean(data.ok),
      modelRunning: isRunning,
      resnetRunning: isRunning,
    };
  } catch {
    return { ok: false, modelRunning: false, resnetRunning: false };
  }
}

export async function predictVideoFile(
  file: File,
  durationSec?: number
): Promise<PredictionResult> {
  const formData = new FormData();
  formData.append('video', file);
  if (durationSec && durationSec > 0) {
    formData.append('durationSec', String(durationSec));
  }

  const response = await fetch('/api/predict', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Inference failed with status ${response.status}`);
  }

  return normalizePredictionResult(data.prediction || data);
}
