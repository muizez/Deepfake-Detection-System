import { normalizePredictionResult, type PredictionResult } from './forensics';

export interface HealthResponse {
  ok: boolean;
  resnetRunning: boolean;
  resnetDetails?: {
    modelFilename?: string;
    threshold?: number;
    device?: string;
    modelLoaded?: boolean;
    metadata?: Record<string, any>;
  } | null;
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { ok: false, resnetRunning: false };
    }
    return await res.json();
  } catch {
    return { ok: false, resnetRunning: false };
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
