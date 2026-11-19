import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { GoogleGenAI, Type } from '@google/genai';
import { normalizePredictionResult } from '../lib/forensics.js';

const INLINE_LIMIT_BYTES = 16 * 1024 * 1024;
const MODEL_NAME = 'gemini-4-hydrogen';

const SYSTEM_INSTRUCTION = `You are a forensic media verification model specializing in deepfake detection, synthetic video identification, and audio-visual manipulation analysis.

Evaluate the provided video carefully across four forensic dimensions:
1. Facial & Lip Sync (perioral boundaries, teeth/tongue consistency, jaw edge blending, unnatural micro-expressions or eye blink cadence).
2. Temporal Coherence (frame-to-frame shimmer, identity drift during head turns, boundary flickering around hair, glasses, or collars).
3. Lighting & Skin Texture (mismatched specular highlights, missing skin pore micro-texture vs sharp background, inconsistent shadow angles, unnatural smoothing).
4. Audio-Visual Alignment (phoneme-to-viseme synchronization, unnatural vocal cadence, synthetic silence or room-tone cutoffs).

If the video is an artificial animation, CGI, or synthetic calibration test pattern rather than authentic camera footage, classify it accurately as DEEPFAKE (synthetic) and explain the synthetic characteristics observed.
Score each of the 4 integrity signals from 0 to 100 (100 = fully authentic, 0 = strongly synthetic/manipulated).
Set manipulationProbability from 0 to 100 (0 = certainly authentic camera capture, 100 = certainly synthetic or manipulated).
Set confidence from 0 to 100 reflecting your certainty given video resolution, lighting, and duration.
Provide chronological timestamped findings in seconds (timestampSec) pointing to concrete visual or audio evidence.`;

const PREDICTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    verdict: {
      type: Type.STRING,
      description: 'Must be one of DEEPFAKE, AUTHENTIC, or INCONCLUSIVE.',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence percentage from 0 to 100.',
    },
    manipulationProbability: {
      type: Type.NUMBER,
      description: 'Estimated probability of synthetic generation or manipulation from 0 to 100.',
    },
    summary: {
      type: Type.STRING,
      description: 'Concise 2-3 sentence forensic summary explaining the verdict.',
    },
    signals: {
      type: Type.OBJECT,
      properties: {
        facialLipSync: {
          type: Type.NUMBER,
          description: 'Integrity score 0-100 for facial and lip-sync authenticity.',
        },
        temporalCoherence: {
          type: Type.NUMBER,
          description: 'Integrity score 0-100 for frame-to-frame temporal stability.',
        },
        lightingReflection: {
          type: Type.NUMBER,
          description: 'Integrity score 0-100 for lighting, shadow, and skin texture physics.',
        },
        audioVisualAlignment: {
          type: Type.NUMBER,
          description: 'Integrity score 0-100 for audio-visual alignment.',
        },
      },
      required: ['facialLipSync', 'temporalCoherence', 'lightingReflection', 'audioVisualAlignment'],
    },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestampSec: {
            type: Type.NUMBER,
            description: 'Timestamp in seconds where this observation occurs.',
          },
          category: {
            type: Type.STRING,
            description: 'Forensic dimension category (e.g., Facial & Lip Sync, Temporal Coherence).',
          },
          severity: {
            type: Type.STRING,
            description: 'Severity level: high, medium, or low.',
          },
          observation: {
            type: Type.STRING,
            description: 'Specific visual or audio observation at this timestamp.',
          },
        },
        required: ['timestampSec', 'category', 'severity', 'observation'],
      },
    },
  },
  required: ['verdict', 'confidence', 'manipulationProbability', 'summary', 'signals', 'findings'],
};

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error(
      'AI detection model requires a valid GEMINI_API_KEY configured in Settings > Secrets.'
    );
    err.statusCode = 503;
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function analyzeWithRetry(fn, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const isTransient =
        message.includes('503') ||
        message.includes('UNAVAILABLE') ||
        message.includes('ECONNRESET') ||
        message.includes('ETIMEDOUT');
      if (!isTransient || attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function analyzeVideoForDeepfake({ buffer, mimeType, fileName, durationSec }) {
  const ai = getClient();
  const normalizedMime = mimeType.split(';')[0].trim() || 'video/mp4';

  const promptText = `Perform a forensic deepfake prediction on the uploaded video (${fileName}${
    durationSec ? `, duration ~${durationSec.toFixed(1)}s` : ''
  }). Inspect spatial facial consistency, temporal transitions, lighting physics, and audio-visual sync. Return the structured JSON prediction.`;

  if (buffer.byteLength <= INLINE_LIMIT_BYTES) {
    const response = await analyzeWithRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: normalizedMime,
                data: buffer.toString('base64'),
              },
            },
            { text: promptText },
          ],
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: PREDICTION_SCHEMA,
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim());
    return normalizePredictionResult(parsed, MODEL_NAME);
  }

  const ext = path.extname(fileName) || '.mp4';
  const tempPath = path.join(os.tmpdir(), `veritas-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  let uploadedFileName;

  try {
    await fs.writeFile(tempPath, buffer);
    const uploaded = await ai.files.upload({
      file: tempPath,
      config: { mimeType: normalizedMime },
    });
    uploadedFileName = uploaded.name;

    let current = uploaded;
    const deadline = Date.now() + 60_000;
    while (current.state === 'PROCESSING' && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1500));
      if (!current.name) break;
      current = await ai.files.get({ name: current.name });
    }

    if (current.state === 'FAILED') {
      throw new Error('Video processing failed on the AI media pipeline. Try re-encoding as standard MP4.');
    }
    if (!current.uri) {
      throw new Error('Uploaded video did not return a playable media URI.');
    }

    const response = await analyzeWithRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            {
              fileData: {
                fileUri: current.uri,
                mimeType: current.mimeType || normalizedMime,
              },
            },
            { text: promptText },
          ],
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: PREDICTION_SCHEMA,
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim());
    return normalizePredictionResult(parsed, MODEL_NAME);
  } finally {
    await fs.unlink(tempPath).catch(() => undefined);
    if (uploadedFileName) {
      await ai.files.delete({ name: uploadedFileName }).catch(() => undefined);
    }
  }
}
