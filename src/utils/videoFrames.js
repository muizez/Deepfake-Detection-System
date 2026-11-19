export async function extractVideoTelemetryAndFrames(file, objectUrl, frameCount = 6) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({
          telemetry: {
            fileName: file.name,
            fileSizeBytes: file.size,
            mimeType: file.type || 'video/mp4',
            durationSec: Number.isFinite(video.duration) ? video.duration : 0,
            width: video.videoWidth || 0,
            height: video.videoHeight || 0,
          },
          frames: [],
        });
      }
    }, 6000);

    const finish = (telemetry, frames) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve({ telemetry, frames });
    };

    video.onerror = () => {
      finish(
        {
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type || 'video/mp4',
          durationSec: 0,
          width: 0,
          height: 0,
        },
        []
      );
    };

    video.onloadedmetadata = async () => {
      if (video.duration === Infinity || !Number.isFinite(video.duration)) {
        await new Promise((resolveDuration) => {
          const onDuration = () => {
            if (Number.isFinite(video.duration) && video.duration > 0) {
              video.removeEventListener('durationchange', onDuration);
              video.removeEventListener('timeupdate', onDuration);
              resolveDuration();
            }
          };
          video.addEventListener('durationchange', onDuration);
          video.addEventListener('timeupdate', onDuration);
          video.currentTime = 1e6;
          window.setTimeout(() => {
            video.removeEventListener('durationchange', onDuration);
            video.removeEventListener('timeupdate', onDuration);
            resolveDuration();
          }, 1200);
        });
        video.currentTime = 0;
      }

      const durationSec = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;

      const telemetry = {
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || 'video/mp4',
        durationSec,
        width,
        height,
      };

      if (durationSec <= 0 || width <= 0 || height <= 0) {
        finish(telemetry, []);
        return;
      }

      const canvas = document.createElement('canvas');
      const targetWidth = 240;
      const targetHeight = Math.max(135, Math.round((height / width) * targetWidth));
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        finish(telemetry, []);
        return;
      }

      const frames = [];
      const count = Math.min(frameCount, Math.max(1, Math.floor(durationSec * 2) || frameCount));

      for (let i = 0; i < count; i++) {
        const ratio = count === 1 ? 0.1 : (i + 0.5) / count;
        const ts = Math.min(durationSec - 0.05, Math.max(0.05, durationSec * ratio));
        try {
          await new Promise((seekResolve) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              seekResolve();
            };
            video.addEventListener('seeked', onSeeked, { once: true });
            video.currentTime = ts;
          });
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          frames.push({
            timestampSec: Math.round(ts * 10) / 10,
            dataUrl: canvas.toDataURL('image/jpeg', 0.72),
          });
        } catch {
          // Skip individual frame capture failure gracefully
        }
      }

      finish(telemetry, frames);
    };
  });
}

export async function createCalibrationTestVideo() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is unavailable in this browser.');
  }

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : 'video/webm';

  const stream = canvas.captureStream(24);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 900_000 });
  const chunks = [];

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const recordingFinished = new Promise((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
  });

  recorder.start(100);

  const totalFrames = 60;
  for (let frame = 0; frame < totalFrames; frame++) {
    const t = frame / totalFrames;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.lineWidth = 1;
    for (let x = 40; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 40; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const cx = 320 + Math.sin(t * Math.PI * 2) * 28;
    const cy = 165 + Math.cos(t * Math.PI * 2) * 8;

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 56, 72, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    const blink = frame > 26 && frame < 31 ? 1.5 : 6;
    ctx.beginPath();
    ctx.ellipse(cx - 20, cy - 12, 7, blink, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 20, cy - 12, 7, blink, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const mouthOpen = 4 + Math.abs(Math.sin(t * Math.PI * 6)) * 10;
    ctx.ellipse(cx, cy + 28, 18, mouthOpen, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText(`SYNTHETIC TEST CLIP · FRAME ${String(frame + 1).padStart(2, '0')}/60`, 24, 326);

    await new Promise((r) => setTimeout(r, 32));
  }

  recorder.stop();
  stream.getTracks().forEach((track) => track.stop());
  const blob = await recordingFinished;

  return new File([blob], 'synthetic-calibration-sample.webm', { type: 'video/webm' });
}
