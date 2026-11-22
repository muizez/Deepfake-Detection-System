import { useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { ArtifactVisual } from './ArtifactVisual';
import { formatTimestamp } from '../lib/forensics';

interface VideoStageProps {
  videoUrl: string | null;
  playing: boolean;
  toggle: () => void;
  currentTime?: number;
  duration?: number;
  onTimeUpdate?: (time: number) => void;
}

export function VideoStage({
  videoUrl,
  playing,
  toggle,
  currentTime = 0,
  duration = 0,
  onTimeUpdate,
}: VideoStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [playing]);

  const handleTimeUpdate = () => {
    if (videoRef.current && onTimeUpdate) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  return (
    <div className="video-stage">
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain bg-black"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={toggle}
          onClick={toggle}
        />
      ) : (
        <ArtifactVisual />
      )}
      <div className="video-hud">
        <span>{formatTimestamp(currentTime)}</span>
        <span>{duration > 0 ? `${formatTimestamp(duration)} / 20 KEYFRAMES` : 'RESNET-50 / 224×224 RGB'}</span>
      </div>
      <button className="play-button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        <Icon name={playing ? 'pause' : 'play'} size={24} />
      </button>
    </div>
  );
}
