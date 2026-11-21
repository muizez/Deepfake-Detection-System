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

export function clampPercentage(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

export function formatTimestamp(seconds) {
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

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateVideoFile(file) {
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

export function computeAverageIntegrity(signals) {
  const values = [
    clampPercentage(signals.facialLipSync),
    clampPercentage(signals.temporalCoherence),
    clampPercentage(signals.lightingReflection),
    clampPercentage(signals.audioVisualAlignment),
  ];
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.round(avg * 10) / 10;
}

export function normalizeVerdict(rawVerdict, manipulationProbability) {
  const upper = (rawVerdict || '').trim().toUpperCase();
  if (upper === 'DEEPFAKE' || upper === 'SYNTHETIC' || upper === 'MANIPULATED') {
    return 'DEEPFAKE';
  }
  if (upper === 'AUTHENTIC' || upper === 'REAL' || upper === 'GENUINE') {
    return 'AUTHENTIC';
  }
  if (upper === 'INCONCLUSIVE' || upper === 'UNCERTAIN') {
    return 'INCONCLUSIVE';
  }
  if (manipulationProbability >= 65) return 'DEEPFAKE';
  if (manipulationProbability <= 35) return 'AUTHENTIC';
  return 'INCONCLUSIVE';
}

export function normalizeSeverity(raw) {
  const lower = (raw || '').trim().toLowerCase();
  if (lower === 'high' || lower === 'critical') return 'high';
  if (lower === 'medium' || lower === 'moderate') return 'medium';
  return 'low';
}

export function normalizePredictionResult(raw = {}, modelUsed = 'ResNet-50 (resnet50-balanced-best)') {
  const signals = {
    facialLipSync: clampPercentage(raw.signals?.facialLipSync ?? 50),
    temporalCoherence: clampPercentage(raw.signals?.temporalCoherence ?? 50),
    lightingReflection: clampPercentage(raw.signals?.lightingReflection ?? 50),
    audioVisualAlignment: clampPercentage(raw.signals?.audioVisualAlignment ?? 50),
  };

  const manipulationProbability = clampPercentage(
    raw.manipulationProbability ?? Math.max(0, 100 - computeAverageIntegrity(signals))
  );
  const verdict = normalizeVerdict(raw.verdict, manipulationProbability);
  const confidence = clampPercentage(raw.confidence ?? (verdict === 'INCONCLUSIVE' ? 54 : 78));

  const findings = Array.isArray(raw.findings)
    ? raw.findings
        .filter((f) => f && typeof f.observation === 'string' && f.observation.trim().length > 0)
        .map((f) => ({
          timestampSec: Number.isFinite(f.timestampSec) ? Math.max(0, Math.round(f.timestampSec * 10) / 10) : 0,
          category: (f.category || 'Visual Artifact').trim(),
          severity: normalizeSeverity(f.severity),
          observation: f.observation.trim(),
        }))
        .sort((a, b) => a.timestampSec - b.timestampSec)
    : [];

  return {
    verdict,
    confidence,
    manipulationProbability,
    summary:
      typeof raw.summary === 'string' && raw.summary.trim().length > 0
        ? raw.summary.trim()
        : 'Forensic evaluation completed across spatial, temporal, and audio-visual dimensions.',
    signals,
    findings,
    modelUsed: raw.modelUsed || modelUsed,
    analyzedAt: raw.analyzedAt || new Date().toISOString(),
  };
}

export function filterInspections(records, verdictFilter, searchQuery) {
  const q = searchQuery.trim().toLowerCase();
  return records.filter((record) => {
    const matchesVerdict = verdictFilter === 'ALL' || record.prediction.verdict === verdictFilter;
    if (!matchesVerdict) return false;
    if (!q) return true;
    return (
      record.title.toLowerCase().includes(q) ||
      record.telemetry.fileName.toLowerCase().includes(q) ||
      record.prediction.summary.toLowerCase().includes(q)
    );
  });
}

export function getVerdictPresentation(verdict) {
  switch (verdict) {
    case 'DEEPFAKE':
      return {
        label: 'Deepfake Detected',
        shortLabel: 'Deepfake',
        description: 'Synthetic manipulation markers identified across sampled frames.',
        bannerClasses: 'bg-red-950/50 border-red-800/80 text-red-100',
        badgeClasses: 'text-red-300 bg-red-950/60 border-red-800/80',
        accentBarClass: 'bg-red-500',
      };
    case 'AUTHENTIC':
      return {
        label: 'Authentic Media',
        shortLabel: 'Authentic',
        description: 'No synthetic generation or face-manipulation indicators detected.',
        bannerClasses: 'bg-emerald-950/50 border-emerald-800/80 text-emerald-100',
        badgeClasses: 'text-emerald-300 bg-emerald-950/60 border-emerald-800/80',
        accentBarClass: 'bg-emerald-500',
      };
    case 'INCONCLUSIVE':
    default:
      return {
        label: 'Inconclusive Review',
        shortLabel: 'Inconclusive',
        description: 'Mixed forensic signals or heavy compression require secondary verification.',
        bannerClasses: 'bg-amber-950/50 border-amber-800/80 text-amber-100',
        badgeClasses: 'text-amber-300 bg-amber-950/60 border-amber-800/80',
        accentBarClass: 'bg-amber-500',
      };
  }
}
