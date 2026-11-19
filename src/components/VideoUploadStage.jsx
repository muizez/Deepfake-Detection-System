import { useEffect, useRef, useState } from 'react';
import {
  Film,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { formatFileSize, formatTimestamp } from '../lib/forensics.js';

export function VideoUploadStage({
  uploadedFile,
  videoUrl,
  telemetry,
  frames,
  activeBenchmark,
  findings,
  isPreparingTestClip,
  seekRequest,
  onFileSelected,
  onGenerateTestClip,
  onClearMedia,
  onTriggerUpload,
  onSelectBenchmark,
  benchmarks,
}) {
  const videoRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const duration = telemetry?.durationSec || 0;

  useEffect(() => {
    setImageLoadFailed(false);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [videoUrl, activeBenchmark?.id]);

  useEffect(() => {
    if (!seekRequest) return;
    const targetSec = Math.max(0, Math.min(duration || seekRequest.timestampSec, seekRequest.timestampSec));
    setCurrentTime(targetSec);
    if (videoRef.current && videoUrl) {
      videoRef.current.currentTime = targetSec;
    }
  }, [seekRequest, duration, videoUrl]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      onFileSelected(dropped);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => undefined);
    } else {
      videoRef.current.pause();
    }
  };

  const seekTo = (seconds) => {
    const clamped = Math.max(0, Math.min(duration || seconds, seconds));
    setCurrentTime(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  };

  const hasMedia = Boolean(videoUrl || activeBenchmark);

  if (!hasMedia) {
    return (
      <section aria-label="Video upload dropzone" className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg px-6 py-12 sm:py-16 text-center transition-colors duration-150 ${
            isDragging
              ? 'border-blue-500 bg-blue-950/30'
              : 'border-slate-700 bg-slate-950/50 hover:border-slate-600'
          }`}
        >
          <div className="mx-auto w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-200 mb-4">
            <Film className="w-6 h-6" aria-hidden="true" />
          </div>

          <h2 className="font-display text-xl font-semibold text-slate-50 mb-2">
            Drop a video file to analyze
          </h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
            Upload MP4, WebM, MOV, AVI, or MKV footage up to 45 MB. Frames and audio cues are evaluated for deepfake manipulation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onTriggerUpload}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              <span>Select Video File</span>
            </button>

            <button
              type="button"
              onClick={onGenerateTestClip}
              disabled={isPreparingTestClip}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <Sparkles className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span>{isPreparingTestClip ? 'Generating Test Clip…' : 'Upload Test Clip'}</span>
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-100">
              Or inspect a reference benchmark case
            </h3>
            <span className="text-xs text-slate-400">Pre-computed forensic examples</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {benchmarks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectBenchmark(item)}
                className="group text-left bg-slate-950/70 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 rounded-lg p-3 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="aspect-video w-full rounded bg-slate-950 overflow-hidden mb-2.5">
                  <img
                    src={item.stillImageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </div>
                <p className="text-sm font-medium text-slate-100 truncate">{item.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {item.prediction.verdict === 'DEEPFAKE'
                    ? 'Deepfake'
                    : item.prediction.verdict === 'AUTHENTIC'
                    ? 'Authentic'
                    : 'Inconclusive'}{' '}
                  · {item.prediction.confidence.toFixed(1)}%
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Video inspection viewport" className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="font-display text-base sm:text-lg font-semibold text-slate-50 truncate">
            {activeBenchmark ? activeBenchmark.title : uploadedFile?.name || 'Uploaded Video'}
          </h2>
          {telemetry && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums mt-0.5">
              <span>{activeBenchmark ? 'Reference Benchmark' : 'Live Upload'}</span>
              <span aria-hidden="true">·</span>
              <span>{formatTimestamp(telemetry.durationSec)}</span>
              {telemetry.width > 0 && telemetry.height > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {telemetry.width}×{telemetry.height}
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{formatFileSize(telemetry.fileSizeBytes)}</span>
              <span aria-hidden="true">·</span>
              <span>{telemetry.mimeType}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onTriggerUpload}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Replace Video</span>
          </button>
          <button
            type="button"
            onClick={onClearMedia}
            aria-label="Clear current video"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 hover:bg-red-950/60 hover:text-red-200 hover:border-red-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            className="w-full h-full object-contain"
          />
        ) : activeBenchmark && !imageLoadFailed ? (
          <img
            src={activeBenchmark.stillImageUrl}
            alt={activeBenchmark.title}
            referrerPolicy="no-referrer"
            onError={() => setImageLoadFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-300 p-6 text-center">
            <Film className="w-8 h-8 mb-2 text-slate-400" aria-hidden="true" />
            <p className="text-sm font-medium">{activeBenchmark?.title || 'Video Frame'}</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-3">
          {videoUrl && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-100 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" aria-hidden="true" />
              )}
            </button>
          )}

          <div className="flex-1">
            <div className="relative flex items-center">
              <label htmlFor="video-timeline-scrubber" className="sr-only">
                Video timeline position
              </label>
              <input
                id="video-timeline-scrubber"
                type="range"
                min={0}
                max={duration > 0 ? duration : 10}
                step={0.1}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {duration > 0 && findings.length > 0 && (
              <div className="relative h-4 mt-1" aria-label="Detected timeline markers">
                {findings.map((finding, idx) => {
                  const pct = Math.max(0, Math.min(100, (finding.timestampSec / duration) * 100));
                  const markerColor =
                    finding.severity === 'high'
                      ? 'bg-red-500'
                      : finding.severity === 'medium'
                      ? 'bg-amber-400'
                      : 'bg-emerald-500';
                  return (
                    <button
                      key={`${finding.timestampSec}-${idx}`}
                      type="button"
                      onClick={() => seekTo(finding.timestampSec)}
                      title={`${formatTimestamp(finding.timestampSec)} — ${finding.category}`}
                      aria-label={`Jump to ${finding.category} at ${formatTimestamp(finding.timestampSec)}`}
                      style={{ left: `${pct}%` }}
                      className={`absolute top-0 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${markerColor} ring-2 ring-slate-900 hover:scale-125 transition-transform cursor-pointer`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-xs font-mono tabular-nums text-slate-300 shrink-0">
            {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
          </div>
        </div>
      </div>

      {frames.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">Sampled Frame Strip</span>
            <span className="text-xs font-mono text-slate-400">Click frame to seek</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {frames.map((frame, index) => (
              <button
                key={`${frame.timestampSec}-${index}`}
                type="button"
                onClick={() => seekTo(frame.timestampSec)}
                className="group relative aspect-video rounded overflow-hidden border border-slate-800 hover:border-blue-500 bg-slate-950 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <img
                  src={frame.dataUrl}
                  alt={`Frame at ${formatTimestamp(frame.timestampSec)}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-slate-950/85 text-[10px] font-mono tabular-nums text-slate-100 rounded">
                  {formatTimestamp(frame.timestampSec)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
