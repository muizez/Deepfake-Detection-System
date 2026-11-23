interface StatusProps {
  online?: boolean;
}

export function Status({ online = true }: StatusProps) {
  return (
    <div className="engine-label">
      <span className={`live-dot ${online ? '' : 'offline'}`} />
      <b>EFFICIENTNET-B3 DETECTION ENGINE</b>
      <i />
      <span>{online ? 'ONLINE' : 'CONNECTING'}</span>
    </div>
  );
}
