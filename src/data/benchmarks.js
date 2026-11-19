export const REFERENCE_BENCHMARKS = [
  {
    id: 'bench-exec-lipsync',
    sourceType: 'benchmark',
    title: 'Executive Webcam Briefing',
    subtitle: 'Wav2Lip-style mouth region synthesis benchmark',
    stillImageUrl: '/src/assets/images/benchmark_executive_clip_1794738027453.jpg',
    thumbnailDataUrl: '/src/assets/images/benchmark_executive_clip_1794738027453.jpg',
    keyframeTimestamps: [0.8, 3.2, 5.6, 8.1, 10.4, 12.8],
    telemetry: {
      fileName: 'executive-briefing-sample.mp4',
      fileSizeBytes: 4_820_000,
      mimeType: 'video/mp4',
      durationSec: 14.2,
      width: 1280,
      height: 720,
    },
    prediction: {
      verdict: 'DEEPFAKE',
      confidence: 93.4,
      manipulationProbability: 91.8,
      summary:
        'High-confidence localized facial synthesis detected around the perioral region. Teeth and lower jaw boundaries soften unnaturally during rapid bilabial speech transitions while upper facial micro-expressions remain static.',
      signals: {
        facialLipSync: 16.5,
        temporalCoherence: 28.0,
        lightingReflection: 64.2,
        audioVisualAlignment: 21.8,
      },
      findings: [
        {
          timestampSec: 2.4,
          category: 'Facial & Lip Sync',
          severity: 'high',
          observation:
            'Soft-focus blending halo visible along the nasolabial fold and lower chin contour during speech.',
        },
        {
          timestampSec: 6.1,
          category: 'Audio-Visual Sync',
          severity: 'high',
          observation:
            'Lip closure lags behind /p/ and /b/ audio transients by approximately 90ms.',
        },
        {
          timestampSec: 10.7,
          category: 'Temporal Coherence',
          severity: 'medium',
          observation:
            'High-frequency skin pore texture disappears inside the mouth bounding box while forehead detail remains sharp.',
        },
      ],
      modelUsed: 'gemini-4-hydrogen',
      analyzedAt: '2026-11-15T09:30:00.000Z',
    },
  },
  {
    id: 'bench-press-authentic',
    sourceType: 'benchmark',
    title: 'Press Podium Statement',
    subtitle: 'Unedited broadcast camera verification benchmark',
    stillImageUrl: '/src/assets/images/benchmark_press_briefing_1794738029280.jpg',
    thumbnailDataUrl: '/src/assets/images/benchmark_press_briefing_1794738029280.jpg',
    keyframeTimestamps: [1.2, 4.5, 7.8, 11.0, 14.3, 17.5],
    telemetry: {
      fileName: 'press-podium-broadcast.mp4',
      fileSizeBytes: 7_450_000,
      mimeType: 'video/mp4',
      durationSec: 18.6,
      width: 1920,
      height: 1080,
    },
    prediction: {
      verdict: 'AUTHENTIC',
      confidence: 96.2,
      manipulationProbability: 5.4,
      summary:
        'Consistent natural skin micro-texture, natural blink cadence, and coherent specular highlights across all sampled frames. Hand-to-face occlusion and microphone shadow geometry remain physically accurate throughout.',
      signals: {
        facialLipSync: 95.8,
        temporalCoherence: 94.1,
        lightingReflection: 96.5,
        audioVisualAlignment: 93.7,
      },
      findings: [
        {
          timestampSec: 3.8,
          category: 'Illumination Physics',
          severity: 'low',
          observation:
            'Corneal catchlights and lapel microphone shadow angles match overhead studio key light geometry.',
        },
        {
          timestampSec: 11.4,
          category: 'Temporal Coherence',
          severity: 'low',
          observation:
            'Natural blink interval and consistent motion blur during rapid hand gesture pass.',
        },
      ],
      modelUsed: 'gemini-4-hydrogen',
      analyzedAt: '2026-11-15T09:12:00.000Z',
    },
  },
  {
    id: 'bench-interview-faceswap',
    sourceType: 'benchmark',
    title: 'Indoor Study Interview',
    subtitle: 'Compressed diffusion face-swap review benchmark',
    stillImageUrl: '/src/assets/images/benchmark_interview_clip_1794738027827.jpg',
    thumbnailDataUrl: '/src/assets/images/benchmark_interview_clip_1794738027827.jpg',
    keyframeTimestamps: [0.9, 2.7, 4.5, 6.4, 8.2, 10.1],
    telemetry: {
      fileName: 'study-interview-compressed.mp4',
      fileSizeBytes: 3_180_000,
      mimeType: 'video/mp4',
      durationSec: 11.4,
      width: 1280,
      height: 720,
    },
    prediction: {
      verdict: 'INCONCLUSIVE',
      confidence: 61.5,
      manipulationProbability: 48.2,
      summary:
        'Aggressive H.264 re-encoding obscures high-frequency skin artifacts. Minor color temperature drift appears on the left cheek near window light, warranting original source file inspection.',
      signals: {
        facialLipSync: 72.0,
        temporalCoherence: 54.5,
        lightingReflection: 46.0,
        audioVisualAlignment: 74.2,
      },
      findings: [
        {
          timestampSec: 4.2,
          category: 'Lighting & Texture',
          severity: 'medium',
          observation:
            'Slight hue mismatch between cheek highlight and natural cool window light during 30-degree head rotation.',
        },
        {
          timestampSec: 7.9,
          category: 'Compression Artifact',
          severity: 'low',
          observation:
            'Macroblocking from low-bitrate re-encoding limits certainty on jawline boundary sharpness.',
        },
      ],
      modelUsed: 'gemini-4-hydrogen',
      analyzedAt: '2026-11-15T08:45:00.000Z',
    },
  },
];
