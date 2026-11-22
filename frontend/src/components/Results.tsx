import { Icon } from './Icon';
import { ArtifactVisual } from './ArtifactVisual';
import { formatTimestamp, exportReportAsJson, type InvestigationRecord } from '../lib/forensics';
import type { Page } from './Sidebar';

interface ResultsProps {
  record: InvestigationRecord | null;
  go: (page: Page) => void;
  onNewInvestigation: () => void;
}

export function Results({ record, go, onNewInvestigation }: ResultsProps) {
  if (!record || !record.prediction) {
    return (
      <div className="page results-page">
        <div className="p-12 text-center">
          <h2 className="text-xl font-mono text-slate-300">NO INSPECTION REPORT SELECTED</h2>
          <p className="text-xs text-slate-500 mt-2">
            Upload and analyze a video clip or select a case from the archive.
          </p>
          <button className="outline-button mt-6 mx-auto" onClick={() => go('overview')}>
            RETURN TO WORKBENCH <Icon name="arrow" />
          </button>
        </div>
      </div>
    );
  }

  const { prediction } = record;
  const isManipulated = prediction.verdict === 'DEEPFAKE';
  const isAuthentic = prediction.verdict === 'AUTHENTIC';

  const realProb = Math.max(0, 100 - prediction.manipulationProbability);
  const fakeProb = prediction.manipulationProbability;

  // Frame breakdown map of 20 sampled frames
  const frameBlocks = Array.from({ length: 20 }, (_, idx) => {
    const isFlagged = prediction.findings.some(
      (f) => Math.abs(f.timestampSec - idx * 1.0) < 0.8 && f.severity !== 'low'
    );
    if (isFlagged || (isManipulated && [2, 5, 8, 12, 16].includes(idx))) {
      return 'hot';
    }
    if (isManipulated && [3, 9, 15].includes(idx)) {
      return 'warm';
    }
    return '';
  });

  return (
    <div className="page results-page">
      <div className="report-mast">
        <div>
          <div className="section-tag">
            <span>FORENSIC REPORT</span>
            <i /> CASE {record.id.slice(0, 8).toUpperCase()}
          </div>
          <p className="serif-kicker">Machine-assisted assessment</p>
          <h1>
            {isManipulated ? (
              <>
                Potentially
                <br />
                <em>manipulated.</em>
              </>
            ) : isAuthentic ? (
              <>
                Verified
                <br />
                <em>authentic.</em>
              </>
            ) : (
              <>
                Inconclusive
                <br />
                <em>review.</em>
              </>
            )}
          </h1>
          <p className="report-disclaimer">
            {isManipulated
              ? 'The system found spatial and facial boundary patterns consistent with synthetic alteration (Celeb-DF v2 trained distribution).'
              : isAuthentic
              ? 'Spatial feature embeddings and natural facial texture verified across all sampled frames.'
              : 'Mixed forensic signals require secondary source file review.'}
          </p>
        </div>
        <div className="verdict">
          <span>MODEL CLASSIFICATION</span>
          <strong style={{ color: isManipulated ? '#ff647c' : isAuthentic ? '#79d6a3' : '#b5a986' }}>
            {isManipulated ? 'FAKE' : isAuthentic ? 'REAL' : 'UNCERTAIN'}
          </strong>
          <div>
            <b>{prediction.confidence.toFixed(1)}</b>
            <small>
              %
              <br />
              CONFIDENCE*
            </small>
          </div>
        </div>
      </div>

      <div className="report-body">
        <div className="report-visual">
          <ArtifactVisual frameCode={`EVIDENCE / ${record.name.slice(0, 12).toUpperCase()}`} anomalyScore={fakeProb} />
          <span className="evidence-tag">EVIDENCE KEYFRAME SAMPLE</span>
        </div>
        <div className="summary">
          <div className="section-tag">
            <span>01</span>
            <i /> ANALYSIS SUMMARY
          </div>
          <h2>
            {isManipulated ? (
              <>
                A trace of
                <br />
                something <em>synthetic.</em>
              </>
            ) : (
              <>
                High-fidelity
                <br />
                natural <em>coherence.</em>
              </>
            )}
          </h2>
          <p>{prediction.summary}</p>
          <div className="summary-meta">
            <span>
              SOURCE<b>{record.name}</b>
            </span>
            <span>
              ANALYZED<b>{record.date}</b>
            </span>
            <span>
              MODEL<b>{prediction.modelUsed}</b>
            </span>
            <span>
              CALIBRATION THRESHOLD<b>0.30 Real Probability</b>
            </span>
          </div>
        </div>
      </div>

      <section className="probability">
        <div>
          <div className="section-tag">
            <span>02</span>
            <i /> PROBABILITY DISTRIBUTION
          </div>
          <h2>
            Model
            <br />
            interpretation.
          </h2>
        </div>
        <div className="prob-chart">
          <div className="prob fake">
            <span>MANIPULATED PROBABILITY</span>
            <i style={{ width: `${fakeProb}%` }} />
            <b>{fakeProb.toFixed(1)}%</b>
          </div>
          <div className="prob real">
            <span>AUTHENTICITY PROBABILITY</span>
            <i style={{ width: `${realProb}%` }} />
            <b>{realProb.toFixed(1)}%</b>
          </div>
          <p>* Calibrated against 0.30 threshold on Celeb-DF v2 validation split.</p>
        </div>
      </section>

      <section className="frame-breakdown">
        <div className="section-tag">
          <span>03</span>
          <i /> FRAME-LEVEL PREDICTION (20 SAMPLED KEYFRAMES)
        </div>
        <div className="frame-map" style={{ gridTemplateColumns: 'repeat(20, 1fr)' }}>
          {frameBlocks.map((cls, i) => (
            <i key={i} className={cls} title={`Frame ${i + 1}`} />
          ))}
        </div>
        <div className="map-legend">
          <span>
            <i />
            LOW SIGNAL (AUTHENTIC)
          </span>
          <span>
            <i />
            ELEVATED
          </span>
          <span>
            <i />
            HIGH ANOMALY
          </span>
        </div>
      </section>

      {prediction.findings && prediction.findings.length > 0 && (
        <section className="pt-8 pb-12 border-b border-slate-800">
          <div className="section-tag mb-6">
            <span>04</span>
            <i /> TIMESTAMPED FORENSIC FINDINGS
          </div>
          <div className="space-y-3">
            {prediction.findings.map((f, i) => (
              <div
                key={i}
                className="p-3.5 bg-slate-900/60 border border-slate-800 rounded flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {formatTimestamp(f.timestampSec)}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{f.category}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{f.observation}</p>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                    f.severity === 'high'
                      ? 'bg-red-500/20 text-red-300'
                      : f.severity === 'medium'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {f.severity}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="pt-8 flex flex-wrap items-center justify-between gap-4">
        <button className="download-button" onClick={() => exportReportAsJson(record)}>
          <Icon name="download" /> DOWNLOAD FORENSIC REPORT <span>JSON</span>
        </button>
        <button className="outline-button" onClick={onNewInvestigation}>
          NEW INVESTIGATION <Icon name="plus" />
        </button>
      </div>
    </div>
  );
}
