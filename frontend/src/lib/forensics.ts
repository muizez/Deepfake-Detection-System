export const MAX_VIDEO_SIZE_BYTES = 45 * 1024 * 1024; // 45 MB

export const SUPPORTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/ogg',
];

export const SUPPORTED_VIDEO_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.mov',
  '.m4v',
  '.avi',
  '.mkv',
  '.ogv',
];

export interface Finding {
  timestampSec: number;
  category: string;
  severity: 'low' | 'medium' | 'high';
  observation: string;
}

export interface PredictionSignals {
  facialLipSync: number;
  temporalCoherence: number;
  lightingReflection: number;
  audioVisualAlignment: number;
}

export interface PredictionResult {
  verdict: 'AUTHENTIC' | 'DEEPFAKE' | 'INCONCLUSIVE';
  confidence: number;
  manipulationProbability: number;
  summary: string;
  signals: PredictionSignals;
  findings: Finding[];
  modelUsed: string;
  analyzedAt: string;
}

export interface InvestigationRecord {
  id: string;
  name: string;
  date: string;
  label: 'AUTHENTIC' | 'MANIPULATED' | 'INCONCLUSIVE';
  score: string;
  tone: 'real' | 'fake' | 'unknown';
  fileSize: number;
  prediction: PredictionResult;
  videoUrl?: string;
}

export function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00.0';
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const wholeSecs = Math.floor(secs);
  const tenths = Math.floor((secs - wholeSecs) * 10 + 1e-6);
  const mm = String(mins).padStart(2, '0');
  const ss = String(wholeSecs).padStart(2, '0');
  return `${mm}:${ss}.${tenths}`;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateVideoFile(file: File | { name: string; size: number; type?: string }): { valid: boolean; reason?: string } {
  if (!file || !file.name) {
    return { valid: false, reason: 'Please select a valid video file.' };
  }
  if (file.size <= 0) {
    return { valid: false, reason: 'The selected video file is empty (0 bytes).' };
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return {
      valid: false,
      reason: `Video exceeds the ${formatFileSize(MAX_VIDEO_SIZE_BYTES)} upload limit.`,
    };
  }

  const normalizedType = (file.type || '').toLowerCase().split(';')[0].trim();
  const lowerName = file.name.toLowerCase();
  const hasSupportedMime = SUPPORTED_VIDEO_MIME_TYPES.includes(normalizedType);
  const hasSupportedExtension = SUPPORTED_VIDEO_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  if (!hasSupportedMime && !hasSupportedExtension) {
    return {
      valid: false,
      reason: 'Unsupported file format. Please upload an MP4, WebM, MOV, AVI, or MKV video.',
    };
  }

  return { valid: true };
}

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

export function normalizeSeverity(raw?: string): 'low' | 'medium' | 'high' {
  const lower = (raw || '').trim().toLowerCase();
  if (lower === 'high' || lower === 'critical') return 'high';
  if (lower === 'medium' || lower === 'moderate') return 'medium';
  return 'low';
}

export function normalizePredictionResult(
  raw: any = {},
  modelUsed: string = 'EfficientNet-B3 (efficientnet_b3_best.pth)'
): PredictionResult {
  const signals: PredictionSignals = {
    facialLipSync: clampPercentage(raw.signals?.facialLipSync ?? 50),
    temporalCoherence: clampPercentage(raw.signals?.temporalCoherence ?? 50),
    lightingReflection: clampPercentage(raw.signals?.lightingReflection ?? 50),
    audioVisualAlignment: clampPercentage(raw.signals?.audioVisualAlignment ?? 50),
  };

  const rawVerdict = (raw.verdict || '').toUpperCase();
  let verdict: 'AUTHENTIC' | 'DEEPFAKE' | 'INCONCLUSIVE' = 'INCONCLUSIVE';
  if (rawVerdict === 'AUTHENTIC' || rawVerdict === 'REAL') {
    verdict = 'AUTHENTIC';
  } else if (rawVerdict === 'DEEPFAKE' || rawVerdict === 'FAKE' || rawVerdict === 'MANIPULATED') {
    verdict = 'DEEPFAKE';
  } else if (raw.manipulationProbability >= 65) {
    verdict = 'DEEPFAKE';
  } else if (raw.manipulationProbability <= 35) {
    verdict = 'AUTHENTIC';
  }

  const manipulationProbability = clampPercentage(
    raw.manipulationProbability ?? (verdict === 'DEEPFAKE' ? 88.0 : 12.0)
  );
  const confidence = clampPercentage(raw.confidence ?? 85.0);

  const findings: Finding[] = Array.isArray(raw.findings)
    ? raw.findings
        .filter((f: any) => f && typeof f.observation === 'string' && f.observation.trim().length > 0)
        .map((f: any) => ({
          timestampSec: Number.isFinite(f.timestampSec) ? Math.max(0, Math.round(f.timestampSec * 10) / 10) : 0,
          category: (f.category || 'Visual Artifact').trim(),
          severity: normalizeSeverity(f.severity),
          observation: f.observation.trim(),
        }))
        .sort((a: Finding, b: Finding) => a.timestampSec - b.timestampSec)
    : [];

  return {
    verdict,
    confidence,
    manipulationProbability,
    summary:
      typeof raw.summary === 'string' && raw.summary.trim().length > 0
        ? raw.summary.trim()
        : 'Forensic evaluation completed across spatial, temporal, and facial artifact dimensions.',
    signals,
    findings,
    modelUsed: raw.modelUsed || modelUsed,
    analyzedAt: raw.analyzedAt || new Date().toISOString(),
  };
}

export function exportReportAsJson(record: InvestigationRecord): void {
  const data = JSON.stringify(record, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${record.name.replace(/\.[^.]+$/, '')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
