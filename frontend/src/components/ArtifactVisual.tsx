interface ArtifactVisualProps {
  compact?: boolean;
  frameCode?: string;
  anomalyScore?: number;
}

export function ArtifactVisual({
  compact = false,
  frameCode = 'FRAME_0241',
  anomalyScore,
}: ArtifactVisualProps) {
  return (
    <div
      className={`artifact ${compact ? 'compact' : ''}`}
      aria-label="Abstract visualization of fragmented video data"
    >
      <div className="artifact-grid" />
      <div className="face-form">
        <i className="eye one" />
        <i className="eye two" />
        <i className="scan-cut" />
      </div>
      <div className="pixel-field p1" />
      <div className="pixel-field p2" />
      <div className="artifact-code">
        {frameCode}
        <br />
        [EFFICIENTNET-B3 / BEST]
        <br />
        {anomalyScore !== undefined ? `RISK: ${anomalyScore.toFixed(1)}%` : '84.17.09.220'}
      </div>
      <div className="tracking-box">
        <span>SUBJECT / 01</span>
      </div>
      <div className="scanline" />
      <span className="corner c1" />
      <span className="corner c2" />
      <span className="corner c3" />
      <span className="corner c4" />
    </div>
  );
}
