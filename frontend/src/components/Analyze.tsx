import { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { Status } from './Status';
import { VideoStage } from './VideoStage';
import type { PredictionResult } from '../lib/forensics';
import type { Page } from './Sidebar';

interface AnalyzeProps {
  go: (page: Page) => void;
  selectedFile: File | null;
  videoUrl: string | null;
  isAnalyzing: boolean;
  progress: number;
  prediction: PredictionResult | null;
  error: string | null;
  onRetry: () => void;
  isBackendOnline?: boolean;
}

const STAGES = [
  'Ingest & decode',
  'Frame extraction (20 keyframes)',
  'Spatial ResNet-50 analysis',
  'Temporal coherence analysis',
  'Synthesis & threshold evaluation',
];

export function Analyze({
  go,
  selectedFile,
  videoUrl,
  isAnalyzing,
  progress,
  prediction,
  error,
  onRetry,
  isBackendOnline = true,
}: AnalyzeProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // 20 timeline slots matching the 20 sampled frames
  const timelineFrames = Array.from({ length: 20 }, (_, i) => {
    // If prediction findings exist, flag corresponding frames
    const hasAnomaly = prediction?.findings?.some(
      (f) => Math.abs(f.timestampSec - (i * 1.5)) < 1.0 && f.severity !== 'low'
    ) || (prediction?.verdict === 'DEEPFAKE' && [3, 7, 11, 14, 18].includes(i));
    return { id: i, alert: Boolean(hasAnomaly) };
  });

  const currentStageIndex =
    progress >= 100 ? 5 : progress >= 80 ? 4 : progress >= 55 ? 3 : progress >= 30 ? 2 : 1;

  return (
    <div className="page analysis-page">
      <div className="analysis-heading">
        <div>
          <div className="section-tag">
            <span>CASE / {selectedFile ? selectedFile.name.slice(0, 10).toUpperCase() : '0174'}</span>
            <i /> ACTIVE ANALYSIS
          </div>
          <h1>
            Reading between
            <br />
            <em>the frames.</em>
          </h1>
        </div>
        <div className="processing-orbit">
          <span>{Math.round(progress)}%</span>
          <small>{isAnalyzing ? 'PROCESSING' : error ? 'FAILED' : 'COMPLETE'}</small>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-950/70 border border-red-800 rounded-lg flex items-center justify-between text-red-200">
          <div>
            <div className="font-semibold text-sm">Model Inference Error</div>
            <p className="text-xs mt-1 text-red-300">{error}</p>
          </div>
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-mono uppercase transition"
          >
            Retry
          </button>
        </div>
      )}

      <div className="analysis-grid">
        <div className="viewer-column">
          <VideoStage
            videoUrl={videoUrl}
            playing={playing}
            toggle={() => setPlaying(!playing)}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
          />
          <div className="timeline-head">
            <span>FRAME EXTRACTION / 20 UNIFORM KEYFRAMES</span>
            <span>{selectedFile ? selectedFile.name : 'SOURCE STREAM'}</span>
          </div>
          <div className="frame-timeline">
            {timelineFrames.map((frame, i) => (
              <div className={frame.alert ? 'suspect' : ''} key={frame.id}>
                <span>{String(i * 12).padStart(3, '0')}</span>
              </div>
            ))}
            <i style={{ left: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        </div>

        <aside className="analysis-aside">
          <Status online={isBackendOnline} />
          <h2>
            Model
            <br />
            observation
          </h2>
          <div className="observation">
            <span>ACTIVE MODEL EMBEDDING</span>
            <strong>{prediction ? prediction.verdict : 'RUNNING'}</strong>
            <p>
              {prediction
                ? prediction.summary
                : 'ResNet-50 evaluating 224×224 normalized frame tensors across Celeb-DF v2 distribution.'}
            </p>
          </div>
          <div className="signal-bars">
            <span>
              <i style={{ width: `${prediction?.signals?.facialLipSync ?? (progress > 50 ? 82 : 45)}%` }} />
              FACIAL INTEGRITY <b>{Math.round(prediction?.signals?.facialLipSync ?? 82)}</b>
            </span>
            <span>
              <i style={{ width: `${prediction?.signals?.temporalCoherence ?? (progress > 70 ? 88 : 50)}%` }} />
              TEMPORAL STABILITY <b>{Math.round(prediction?.signals?.temporalCoherence ?? 88)}</b>
            </span>
            <span>
              <i style={{ width: `${prediction?.signals?.lightingReflection ?? (progress > 90 ? 76 : 60)}%` }} />
              LIGHTING & TEXTURE <b>{Math.round(prediction?.signals?.lightingReflection ?? 76)}</b>
            </span>
          </div>
        </aside>
      </div>

      <div className="stages">
        {STAGES.map((stage, i) => {
          const isDone = i < currentStageIndex || progress >= 100;
          const isActive = i === currentStageIndex && progress < 100;
          return (
            <div className={isDone ? 'done' : isActive ? 'active' : ''} key={stage}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <i />
              <p>
                {stage}
                <small>{isDone ? 'COMPLETE' : isActive ? 'IN PROGRESS' : 'PENDING'}</small>
              </p>
            </div>
          );
        })}
      </div>

      {prediction && (
        <button className="complete-demo" onClick={() => go('results')}>
          VIEW COMPLETED REPORT <Icon name="arrow" />
        </button>
      )}
    </div>
  );
}
