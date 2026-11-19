import { useState } from 'react';
import { ExternalLink, Search, Trash2, Upload } from 'lucide-react';
import {
  filterInspections,
  formatFileSize,
  formatTimestamp,
  getVerdictPresentation,
} from '../lib/forensics.js';

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'DEEPFAKE', label: 'Deepfake' },
  { value: 'AUTHENTIC', label: 'Authentic' },
  { value: 'INCONCLUSIVE', label: 'Inconclusive' },
];

export function HistoryView({
  records,
  onInspectRecord,
  onDeleteRecord,
  onClearHistory,
  onTriggerUpload,
}) {
  const [verdictFilter, setVerdictFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = filterInspections(records, verdictFilter, searchQuery);

  return (
    <section aria-label="Inspection history" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
            Inspection History
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Review past deepfake predictions and reload full forensic breakdowns.
          </p>
        </div>

        {records.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 hover:bg-red-950/60 hover:text-red-200 hover:border-red-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Clear All History
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <h2 className="font-display text-lg font-semibold text-slate-50">
            No inspections recorded yet
          </h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto mt-1.5 mb-6">
            Upload a video in the Workbench and run a deepfake prediction. Completed reports are saved here automatically.
          </p>
          <button
            type="button"
            onClick={onTriggerUpload}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>Upload First Video</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg" role="group" aria-label="Filter by verdict">
              {FILTER_OPTIONS.map((opt) => {
                const active = verdictFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVerdictFilter(opt.value)}
                    aria-pressed={active}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-slate-800 text-slate-50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="history-search-input" className="sr-only">
                Search inspected videos
              </label>
              <input
                id="history-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search filename or summary..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No inspection records match your current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-4">Video</th>
                    <th className="py-2.5 px-4">Verdict</th>
                    <th className="py-2.5 px-4 text-right">Confidence</th>
                    <th className="py-2.5 px-4 text-right">Risk</th>
                    <th className="py-2.5 px-4 text-right">Duration</th>
                    <th className="py-2.5 px-4 text-right">Size</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {filtered.map((record) => {
                    const presentation = getVerdictPresentation(record.prediction.verdict);
                    const verdictColor =
                      record.prediction.verdict === 'DEEPFAKE'
                        ? 'text-red-400'
                        : record.prediction.verdict === 'AUTHENTIC'
                        ? 'text-emerald-400'
                        : 'text-amber-400';

                    return (
                      <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-slate-100 truncate max-w-[240px]">
                            {record.title}
                          </div>
                          <div className="text-xs text-slate-400 font-mono truncate max-w-[240px]">
                            {record.telemetry.fileName}
                          </div>
                        </td>
                        <td className={`py-2.5 px-4 font-semibold whitespace-nowrap ${verdictColor}`}>
                          {presentation.shortLabel}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-100">
                          {record.prediction.confidence.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                          {record.prediction.manipulationProbability.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                          {formatTimestamp(record.telemetry.durationSec)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                          {formatFileSize(record.telemetry.fileSizeBytes)}
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onInspectRecord(record)}
                              aria-label={`Inspect ${record.title}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 rounded transition-colors cursor-pointer"
                            >
                              <span>Inspect</span>
                              <ExternalLink className="w-3 h-3" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteRecord(record.id)}
                              aria-label={`Delete ${record.title}`}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/60 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
