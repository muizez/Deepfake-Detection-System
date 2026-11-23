import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Icon } from './Icon';
import { Status } from './Status';
import { ArtifactVisual } from './ArtifactVisual';
import { InvestigationTable } from './InvestigationTable';
import { formatFileSize, validateVideoFile, type InvestigationRecord } from '../lib/forensics';
import type { Page } from './Sidebar';

interface OverviewProps {
  go: (page: Page) => void;
  onSelectFile: (file: File) => void;
  selectedFile: File | null;
  onStartAnalysis: () => void;
  investigations: InvestigationRecord[];
  onViewRecord: (record: InvestigationRecord) => void;
  isBackendOnline?: boolean;
}

export function Overview({
  go,
  onSelectFile,
  selectedFile,
  onStartAnalysis,
  investigations,
  onViewRecord,
  isBackendOnline = true,
}: OverviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const check = validateVideoFile(file);
    if (!check.valid) {
      setUploadError(check.reason || 'Invalid video file format.');
      return;
    }
    setUploadError(null);
    onSelectFile(file);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const totalAnalyzed = investigations.length;
  const authenticCount = investigations.filter((i) => i.label === 'AUTHENTIC').length;
  const manipulatedCount = investigations.filter((i) => i.label === 'MANIPULATED').length;

  return (
    <div className="page overview-page">
      <section className="hero">
        <div className="hero-copy">
          <Status online={isBackendOnline} />
          <p className="serif-kicker">Digital truth, examined.</p>
          <h1>
            Seeing beyond
            <br />
            <em>what's real.</em>
          </h1>
          <p className="hero-deck">
            An intelligent forensic system powered by the EfficientNet-B3 deepfake detection model.
            Extracts 20 uniform video keyframes and evaluates manipulation patterns at 300×300 resolution.
          </p>
          <button className="text-link" onClick={() => (selectedFile ? onStartAnalysis() : inputRef.current?.click())}>
            {selectedFile ? 'ANALYZE SELECTED FOOTAGE' : 'BEGIN AN INVESTIGATION'} <Icon name="arrow" />
          </button>
        </div>
        <ArtifactVisual />
        <p className="vertical-note">AUTHENTICITY / EFFICIENTNET-B3 / CELEB-DF</p>
      </section>

      <section className="metrics">
        <div className="metric-intro">
          <span>01 / SIGNALS</span>
          <p>Verified forensic telemetry</p>
        </div>
        {[
          [String(totalAnalyzed), 'Videos analyzed in session'],
          [String(authenticCount), 'Classified as authentic'],
          [String(manipulatedCount), 'Identified as manipulated'],
          ['0.50', 'Calibrated decision threshold'],
        ].map(([value, label], i) => (
          <div className={`metric m${i}`} key={label}>
            <sup>0{i + 1}</sup>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
        <p className="metric-note">
          Predictions evaluated using efficientnet_b3_best.pth on Celeb-DF v2 dataset.
        </p>
      </section>

      <section className="workbench">
        <div className="section-tag">
          <span>02</span>
          <i /> ANALYSIS WORKSPACE
        </div>
        <div className="workbench-title">
          <h2>
            Investigate
            <br />
            <em>a file.</em>
          </h2>
          <p>
            Drop your video footage. The EfficientNet-B3 CNN will examine
            <br />
            spatial boundaries and subtle temporal manipulation.
          </p>
        </div>

        {uploadError && (
          <div className="mb-4 p-3 bg-red-950/70 border border-red-800 rounded text-red-200 text-xs font-mono">
            {uploadError}
          </div>
        )}

        <div className="upload-workspace">
          <div
            className={`upload-field ${dragActive ? 'drag' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <input
              hidden
              ref={inputRef}
              type="file"
              accept=".mp4,.mov,.avi,.webm,.mkv,video/*"
              onChange={handleInputChange}
            />
            <div className="upload-cross">
              <span />
              <span />
              <Icon name={selectedFile ? 'file' : 'upload'} size={28} />
            </div>
            <span className="upload-no">INPUT / 001</span>
            <h3>
              {selectedFile ? (
                selectedFile.name
              ) : (
                <>
                  DROP VIDEO
                  <br />
                  INTO THE FIELD
                </>
              )}
            </h3>
            <p>
              {selectedFile
                ? `${formatFileSize(selectedFile.size)} / READY TO EXAMINE`
                : 'Drag + drop or select MP4, MOV, WebM, or AVI footage from your device.'}
            </p>
            <button className="outline-button" onClick={() => inputRef.current?.click()}>
              {selectedFile ? 'REPLACE VIDEO' : 'UPLOAD VIDEO'} <Icon name="plus" />
            </button>
            <div className="formats">
              <span>MP4</span>
              <span>MOV</span>
              <span>WEBM</span>
              <span>AVI</span>
              <small>MAX / 45MB</small>
            </div>
          </div>

          <div className="preview-field">
            <ArtifactVisual compact frameCode={selectedFile ? selectedFile.name.slice(0, 15).toUpperCase() : 'AWAITING'} />
            <div className="preview-caption">
              <span>VIDEO SOURCE</span>
              <span>{selectedFile ? 'SOURCE LOADED' : 'AWAITING SOURCE'}</span>
            </div>
          </div>

          <button
            className="analyze-cta"
            disabled={!selectedFile}
            onClick={onStartAnalysis}
          >
            <span>
              ANALYZE
              <br />
              FOOTAGE
            </span>
            <Icon name="arrow" size={25} />
          </button>
        </div>
      </section>

      <section className="recent">
        <div className="section-tag">
          <span>03</span>
          <i /> RECENT INVESTIGATIONS
        </div>
        <div className="recent-head">
          <h2>Case notes.</h2>
          <button onClick={() => go('archive')}>
            ENTER ARCHIVE <Icon name="arrow" />
          </button>
        </div>
        <InvestigationTable rows={investigations.slice(0, 4)} onView={onViewRecord} />
      </section>
    </div>
  );
}
