import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_VIDEO_SIZE_BYTES,
  computeAverageIntegrity,
  filterInspections,
  formatFileSize,
  formatTimestamp,
  normalizePredictionResult,
  validateVideoFile,
} from './forensics.js';

test('formatTimestamp formats seconds and tenths cleanly', () => {
  assert.equal(formatTimestamp(0), '00:00.0');
  assert.equal(formatTimestamp(4.2), '00:04.2');
  assert.equal(formatTimestamp(65.7), '01:05.7');
  assert.equal(formatTimestamp(-3), '00:00.0');
});

test('formatFileSize scales bytes, KB, and MB cleanly', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(5 * 1024 * 1024), '5.0 MB');
});

test('validateVideoFile rejects empty, oversized, and non-video files', () => {
  assert.deepEqual(validateVideoFile({ name: 'clip.mp4', size: 1024, type: 'video/mp4' }), {
    valid: true,
  });

  const empty = validateVideoFile({ name: 'empty.mp4', size: 0, type: 'video/mp4' });
  assert.equal(empty.valid, false);

  const tooLarge = validateVideoFile({
    name: 'huge.mp4',
    size: MAX_VIDEO_SIZE_BYTES + 1,
    type: 'video/mp4',
  });
  assert.equal(tooLarge.valid, false);

  const wrongType = validateVideoFile({ name: 'notes.pdf', size: 4096, type: 'application/pdf' });
  assert.equal(wrongType.valid, false);

  assert.deepEqual(validateVideoFile({ name: 'capture.mov', size: 4096, type: '' }), {
    valid: true,
  });
});

test('normalizePredictionResult clamps scores and sorts findings chronologically', () => {
  const normalized = normalizePredictionResult({
    verdict: 'synthetic',
    confidence: 142.6,
    manipulationProbability: 88.44,
    signals: {
      facialLipSync: 22.3,
      temporalCoherence: -10,
      lightingReflection: 41.2,
      audioVisualAlignment: 19.6,
    },
    findings: [
      {
        timestampSec: 9.4,
        category: 'Temporal Flicker',
        severity: 'medium',
        observation: 'Jawline edge shimmer during head turn.',
      },
      {
        timestampSec: 2.1,
        category: 'Lip Sync',
        severity: 'high',
        observation: 'Phoneme mismatch on plosive consonants.',
      },
    ],
  });

  assert.equal(normalized.verdict, 'DEEPFAKE');
  assert.equal(normalized.confidence, 100);
  assert.equal(normalized.manipulationProbability, 88.4);
  assert.equal(normalized.signals.temporalCoherence, 0);
  assert.equal(normalized.findings.length, 2);
  assert.equal(normalized.findings[0].timestampSec, 2.1);
  assert.equal(normalized.findings[1].timestampSec, 9.4);
});

test('computeAverageIntegrity averages the four signal scores', () => {
  const avg = computeAverageIntegrity({
    facialLipSync: 80,
    temporalCoherence: 90,
    lightingReflection: 70,
    audioVisualAlignment: 80,
  });
  assert.equal(avg, 80);
});

test('filterInspections filters by verdict and search query', () => {
  const sampleRecords = [
    {
      id: '1',
      sourceType: 'upload',
      title: 'CEO Briefing Clip',
      telemetry: {
        fileName: 'ceo-briefing.mp4',
        fileSizeBytes: 2400000,
        mimeType: 'video/mp4',
        durationSec: 12,
        width: 1280,
        height: 720,
      },
      prediction: normalizePredictionResult({
        verdict: 'DEEPFAKE',
        confidence: 92,
        summary: 'Lip-sync anomaly detected.',
      }),
    },
    {
      id: '2',
      sourceType: 'benchmark',
      title: 'Press Podium Statement',
      telemetry: {
        fileName: 'press-podium.mp4',
        fileSizeBytes: 3100000,
        mimeType: 'video/mp4',
        durationSec: 18,
        width: 1920,
        height: 1080,
      },
      prediction: normalizePredictionResult({
        verdict: 'AUTHENTIC',
        confidence: 96,
        summary: 'Consistent studio lighting and audio.',
      }),
    },
  ];

  assert.equal(filterInspections(sampleRecords, 'ALL', '').length, 2);
  assert.equal(filterInspections(sampleRecords, 'DEEPFAKE', '').length, 1);
  assert.equal(filterInspections(sampleRecords, 'AUTHENTIC', 'podium').length, 1);
  assert.equal(filterInspections(sampleRecords, 'AUTHENTIC', 'ceo').length, 0);
});
