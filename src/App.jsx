import { useEffect, useRef, useState } from 'react';
import { BenchmarksView } from './components/BenchmarksView.jsx';
import { HistoryView } from './components/HistoryView.jsx';
import { MethodologyView } from './components/MethodologyView.jsx';
import { PredictionPanel } from './components/PredictionPanel.jsx';
import { TopBar } from './components/TopBar.jsx';
import { VideoUploadStage } from './components/VideoUploadStage.jsx';
import { REFERENCE_BENCHMARKS } from './data/benchmarks.js';
import { normalizePredictionResult, validateVideoFile } from './lib/forensics.js';
import {
  createCalibrationTestVideo,
  extractVideoTelemetryAndFrames,
} from './utils/videoFrames.js';

const HISTORY_STORAGE_KEY = 'veritas_forensics_history_v1';

function loadSavedHistory() {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('workbench');

  const [uploadedFile, setUploadedFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [frames, setFrames] = useState([]);

  const [activeBenchmark, setActiveBenchmark] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPreparingTestClip, setIsPreparingTestClip] = useState(false);
  const [error, setError] = useState(null);
  const [seekRequest, setSeekRequest] = useState(null);

  const [history, setHistory] = useState(() => loadSavedHistory());

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage quota issues gracefully
    }
  }, [history]);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (file) => {
    const validation = validateVideoFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      setActiveTab('workbench');
      setError(validation.reason);
      return;
    }

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    const nextUrl = URL.createObjectURL(file);
    setActiveTab('workbench');
    setActiveBenchmark(null);
    setUploadedFile(file);
    setVideoUrl(nextUrl);
    setPrediction(null);
    setError(null);
    setFrames([]);
    setTelemetry({
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || 'video/mp4',
      durationSec: 0,
      width: 0,
      height: 0,
    });

    const extracted = await extractVideoTelemetryAndFrames(file, nextUrl, 6);
    setTelemetry(extracted.telemetry);
    setFrames(extracted.frames);
  };

  const handleGenerateTestClip = async () => {
    setError(null);
    setIsPreparingTestClip(true);
    try {
      const testFile = await createCalibrationTestVideo();
      await handleFileSelected(testFile);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to generate calibration test clip.';
      setError(message);
    } finally {
      setIsPreparingTestClip(false);
    }
  };

  const handleRunPrediction = async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', uploadedFile);
      if (telemetry?.durationSec) {
        formData.append('durationSec', String(telemetry.durationSec));
      }

      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload?.error || `Prediction request failed with status ${response.status}.`
        );
      }

      const normalized = normalizePredictionResult(payload.prediction);
      setPrediction(normalized);

      const newRecord = {
        id: `insp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sourceType: 'upload',
        title: uploadedFile.name.replace(/\.[^.]+$/, ''),
        telemetry: telemetry || {
          fileName: uploadedFile.name,
          fileSizeBytes: uploadedFile.size,
          mimeType: uploadedFile.type || 'video/mp4',
          durationSec: 0,
          width: 0,
          height: 0,
        },
        prediction: normalized,
        thumbnailDataUrl: frames[0]?.dataUrl,
      };

      setHistory((prev) => [newRecord, ...prev].slice(0, 30));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unexpected network error while requesting deepfake prediction.';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearMedia = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setUploadedFile(null);
    setVideoUrl(null);
    setTelemetry(null);
    setFrames([]);
    setActiveBenchmark(null);
    setPrediction(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectBenchmark = (benchmark) => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setActiveTab('workbench');
    setUploadedFile(null);
    setVideoUrl(null);
    setActiveBenchmark(benchmark);
    setTelemetry(benchmark.telemetry);
    setFrames(
      benchmark.keyframeTimestamps.map((ts) => ({
        timestampSec: ts,
        dataUrl: benchmark.stillImageUrl,
      }))
    );
    setPrediction(benchmark.prediction);
    setError(null);
  };

  const handleInspectHistoryRecord = (record) => {
    if (record.sourceType === 'benchmark') {
      const match = REFERENCE_BENCHMARKS.find((b) => b.id === record.id);
      if (match) {
        handleSelectBenchmark(match);
        return;
      }
    }
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setActiveTab('workbench');
    setUploadedFile(null);
    setVideoUrl(null);
    setActiveBenchmark({
      ...record,
      subtitle: 'Saved inspection report',
      stillImageUrl: record.thumbnailDataUrl || '',
      keyframeTimestamps: record.prediction.findings.map((f) => f.timestampSec),
    });
    setTelemetry(record.telemetry);
    setFrames(
      record.thumbnailDataUrl
        ? [{ timestampSec: 0, dataUrl: record.thumbnailDataUrl }]
        : []
    );
    setPrediction(record.prediction);
    setError(null);
  };

  const handleExportReport = () => {
    if (!prediction) return;
    const report = {
      exportedAt: new Date().toISOString(),
      media: telemetry,
      prediction,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = (telemetry?.fileName || 'forensic-report').replace(/\.[^.]+$/, '');
    link.href = url;
    link.download = `${baseName}-prediction.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/*"
        aria-label="Upload video file"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelected(file);
          }
        }}
      />

      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onTriggerUpload={handleTriggerUpload}
        historyCount={history.length}
      />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'workbench' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
                  Video Deepfake Detection Workbench
                </h1>
                <p className="text-sm sm:text-base text-slate-300 mt-1.5 leading-relaxed">
                  Upload any video clip to inspect sampled frames and receive an AI forensic prediction with confidence scoring and timestamped evidence.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <VideoUploadStage
                  uploadedFile={uploadedFile}
                  videoUrl={videoUrl}
                  telemetry={telemetry}
                  frames={frames}
                  activeBenchmark={activeBenchmark}
                  findings={prediction?.findings || []}
                  isPreparingTestClip={isPreparingTestClip}
                  seekRequest={seekRequest}
                  onFileSelected={handleFileSelected}
                  onGenerateTestClip={handleGenerateTestClip}
                  onClearMedia={handleClearMedia}
                  onTriggerUpload={handleTriggerUpload}
                  onSelectBenchmark={handleSelectBenchmark}
                  benchmarks={REFERENCE_BENCHMARKS}
                />
              </div>

              <div className="lg:col-span-5">
                <PredictionPanel
                  hasUploadedFile={Boolean(uploadedFile)}
                  isBenchmark={Boolean(activeBenchmark)}
                  isAnalyzing={isAnalyzing}
                  error={error}
                  prediction={prediction}
                  fileName={telemetry?.fileName || null}
                  onRunPrediction={handleRunPrediction}
                  onSeekTimestamp={(timestampSec) =>
                    setSeekRequest({ timestampSec, nonce: Date.now() })
                  }
                  onExportReport={handleExportReport}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'benchmarks' && (
          <BenchmarksView
            benchmarks={REFERENCE_BENCHMARKS}
            onLoadBenchmark={handleSelectBenchmark}
          />
        )}

        {activeTab === 'methodology' && <MethodologyView />}

        {activeTab === 'history' && (
          <HistoryView
            records={history}
            onInspectRecord={handleInspectHistoryRecord}
            onDeleteRecord={(id) =>
              setHistory((prev) => prev.filter((item) => item.id !== id))
            }
            onClearHistory={() => setHistory([])}
            onTriggerUpload={handleTriggerUpload}
          />
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span>DEKHTE HAIN · Media Authenticity Inspection</span>
          <span>Supports MP4, WebM, MOV, AVI, and MKV up to 45 MB</span>
        </div>
      </footer>
    </div>
  );
}
