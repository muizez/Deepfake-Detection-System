import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { formatTimestamp, getVerdictPresentation } from '../lib/forensics.js';

const SIGNAL_DEFINITIONS = [
  {
    key: 'facialLipSync',
    label: 'Facial & Lip Sync',
    hint: 'Mouth contour consistency and micro-expressions',
  },
  {
    key: 'temporalCoherence',
    label: 'Temporal Coherence',
    hint: 'Frame-to-frame stability and edge flicker',
  },
  {
    key: 'lightingReflection',
    label: 'Lighting & Texture',
    hint: 'Skin pore detail, shadows, and eye reflections',
  },
  {
    key: 'audioVisualAlignment',
    label: 'Audio-Visual Sync',
    hint: 'Phoneme timing and acoustic continuity',
  },
];

function getSignalColorClass(score) {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 45) return 'bg-amber-500';
  return 'bg-red-500';
}

export function PredictionPanel({
  hasUploadedFile,
  isBenchmark,
  isAnalyzing,
  error,
  prediction,
  fileName,
  onRunPrediction,
  onSeekTimestamp,
  onExportReport,
}) {
  if (isAnalyzing) {
    return (
      <aside
        aria-label="Prediction in progress"
        aria-busy="true"
        className="bg-slate-900 border border-slate-800 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-slate-50">
              Running Deepfake Prediction
            </h2>
            <p className="text-xs text-slate-400">
              Evaluating spatial and temporal artifacts on {fileName || 'uploaded clip'}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {[
            'Streaming video payload to forensic model',
            'Inspecting facial boundaries and lip-sync cadence',
            'Checking temporal motion and illumination physics',
            'Calibrating prediction confidence score',
          ].map((step) => (
            <div key={step} className="flex items-center gap-3 text-sm text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
              <span>{step}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800 animate-pulse">
          <div className="h-16 bg-slate-800 rounded-lg" />
          <div className="h-24 bg-slate-800 rounded-lg" />
          <div className="h-20 bg-slate-800 rounded-lg" />
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside aria-label="Prediction error" className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div role="alert" className="bg-red-950/50 border border-red-800/80 rounded-lg p-4 text-red-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-red-100">Prediction Failed</h2>
              <p className="text-sm text-red-200 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        </div>

        {hasUploadedFile && (
          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={onRunPrediction}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Retry Prediction</span>
            </button>
          </div>
        )}
      </aside>
    );
  }

  if (!prediction) {
    return (
      <aside aria-label="Forensic prediction summary" className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <ScanSearch className="w-5 h-5 text-slate-300" aria-hidden="true" />
          <h2 className="font-display text-base font-semibold text-slate-50">
            Prediction Report
          </h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-5">
          {hasUploadedFile
            ? 'Your video is staged and ready. Run the detection model to compute a verdict, confidence percentage, and timestamped artifact findings.'
            : 'Upload a video clip or load a reference benchmark to view the deepfake prediction, confidence metrics, and frame-level evidence.'}
        </p>

        {hasUploadedFile && (
          <button
            type="button"
            onClick={onRunPrediction}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors mb-6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ScanSearch className="w-4 h-4" aria-hidden="true" />
            <span>Run Prediction</span>
          </button>
        )}

        <div className="pt-5 border-t border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Evaluated Dimensions
          </h3>
          {SIGNAL_DEFINITIONS.map((sig) => (
            <div key={sig.key} className="flex items-baseline justify-between gap-4 py-1">
              <div>
                <p className="text-sm font-medium text-slate-100">{sig.label}</p>
                <p className="text-xs text-slate-400">{sig.hint}</p>
              </div>
              <span className="text-xs font-mono text-slate-400 shrink-0">--%</span>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  const presentation = getVerdictPresentation(prediction.verdict);
  const VerdictIcon =
    prediction.verdict === 'DEEPFAKE'
      ? ShieldAlert
      : prediction.verdict === 'AUTHENTIC'
      ? ShieldCheck
      : AlertTriangle;

  return (
    <aside aria-label="Prediction result" className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className={`border rounded-lg p-4 ${presentation.bannerClasses}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <VerdictIcon className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium opacity-80">
                {isBenchmark ? 'Reference Benchmark Verdict' : 'AI Model Prediction'}
              </p>
              <h2 className="font-display text-xl font-bold tracking-tight mt-0.5">
                {presentation.label}
              </h2>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-mono text-2xl font-semibold tabular-nums leading-none">
              {prediction.confidence.toFixed(1)}%
            </div>
            <div className="text-xs opacity-80 mt-1">Confidence</div>
          </div>
        </div>

        <p className="text-xs mt-3 opacity-90 leading-relaxed">{presentation.description}</p>

        <div className="mt-3 pt-3 border-t border-current/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono tabular-nums">
          <span>Manipulation Risk: {prediction.manipulationProbability.toFixed(1)}%</span>
          <span>Model: {prediction.modelUsed}</span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Forensic Summary
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed">{prediction.summary}</p>
      </div>

      <div className="pt-5 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Signal Integrity Breakdown
          </h3>
          <span className="text-xs text-slate-400">100% = Authentic</span>
        </div>

        <div className="space-y-3.5">
          {SIGNAL_DEFINITIONS.map((sig) => {
            const value = prediction.signals[sig.key];
            return (
              <div key={sig.key}>
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-sm font-medium text-slate-200">{sig.label}</span>
                  <span className="text-sm font-mono font-semibold tabular-nums text-slate-50">
                    {value.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getSignalColorClass(
                      value
                    )}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-5 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Timestamped Evidence ({prediction.findings.length})
          </h3>
          <span className="text-xs text-slate-400">Click time to seek</span>
        </div>

        {prediction.findings.length === 0 ? (
          <p className="text-sm text-slate-400">
            No localized timestamp anomalies flagged during inspection.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {prediction.findings.map((finding, idx) => {
              const severityLabel =
                finding.severity === 'high'
                  ? 'High Risk'
                  : finding.severity === 'medium'
                  ? 'Moderate'
                  : 'Nominal';
              const severityTextClass =
                finding.severity === 'high'
                  ? 'text-red-400'
                  : finding.severity === 'medium'
                  ? 'text-amber-400'
                  : 'text-emerald-400';

              return (
                <li key={`${finding.timestampSec}-${idx}`} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => onSeekTimestamp(finding.timestampSec)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-medium tabular-nums text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 rounded transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>{formatTimestamp(finding.timestampSec)}</span>
                      </button>
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {finding.category}
                      </span>
                    </div>
                    <span className={`text-xs font-medium shrink-0 ${severityTextClass}`}>
                      {severityLabel}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{finding.observation}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExportReport}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Export JSON Report</span>
        </button>

        {hasUploadedFile && (
          <button
            type="button"
            onClick={onRunPrediction}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Re-run Prediction</span>
          </button>
        )}
      </div>
    </aside>
  );
}
