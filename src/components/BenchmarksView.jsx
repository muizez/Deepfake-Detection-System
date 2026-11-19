import { useState } from 'react';
import { ArrowRight, Film } from 'lucide-react';
import { formatFileSize, formatTimestamp, getVerdictPresentation } from '../lib/forensics.js';

export function BenchmarksView({ benchmarks, onLoadBenchmark }) {
  const [failedImages, setFailedImages] = useState({});

  return (
    <section aria-label="Reference benchmark cases" className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
          Reference Benchmark Cases
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
          Inspect pre-computed forensic reports across synthetic lip-sync, unedited broadcast footage, and heavily compressed face-swap examples.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {benchmarks.map((item) => {
          const presentation = getVerdictPresentation(item.prediction.verdict);
          const hasFailed = Boolean(failedImages[item.id]);

          return (
            <article
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col"
            >
              <div className="aspect-video w-full bg-slate-950 overflow-hidden">
                {!hasFailed ? (
                  <img
                    src={item.stillImageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-4">
                    <Film className="w-7 h-7 mb-1.5 text-slate-400" aria-hidden="true" />
                    <span className="text-xs font-medium">{item.title}</span>
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums text-slate-400 mb-2">
                  <span>{formatTimestamp(item.telemetry.durationSec)}</span>
                  <span>
                    {item.telemetry.width}×{item.telemetry.height} · {formatFileSize(item.telemetry.fileSizeBytes)}
                  </span>
                </div>

                <h2 className="font-display text-lg font-semibold text-slate-50">
                  {item.title}
                </h2>
                <p className="text-sm text-slate-300 mt-1 mb-4 leading-relaxed flex-1">
                  {item.subtitle}
                </p>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div
                      className={`text-xs font-semibold ${
                        item.prediction.verdict === 'DEEPFAKE'
                          ? 'text-red-400'
                          : item.prediction.verdict === 'AUTHENTIC'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {presentation.label}
                    </div>
                    <div className="text-xs font-mono tabular-nums text-slate-400 mt-0.5">
                      {item.prediction.confidence.toFixed(1)}% confidence
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onLoadBenchmark(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span>Inspect Case</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
