import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_VIDEO_SIZE_BYTES, validateVideoFile } from './src/lib/forensics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:5000';

app.use(express.json({ limit: '2mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_SIZE_BYTES,
  },
});

app.get('/api/health', async (_req, res) => {
  let resnetRunning = false;
  let resnetDetails = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const pyRes = await fetch(`${PYTHON_BACKEND_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (pyRes.ok) {
      resnetRunning = true;
      resnetDetails = await pyRes.json().catch(() => null);
    }
  } catch {
    resnetRunning = false;
  }

  res.json({
    ok: true,
    resnetRunning,
    resnetDetails,
  });
});

app.post('/api/predict', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No video file was provided in the upload request.' });
      return;
    }

    const validation = validateVideoFile({
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
    });

    if (!validation.valid) {
      res.status(400).json({ error: validation.reason });
      return;
    }

    const rawDuration = Number(req.body?.durationSec);
    const durationSec = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : undefined;

    // Route directly to Python ResNet-50 Backend (resnet50-balanced-best)
    try {
      const pyFormData = new FormData();
      const fileBlob = new Blob([req.file.buffer], { type: req.file.mimetype || 'video/mp4' });
      pyFormData.append('video', fileBlob, req.file.originalname);
      if (durationSec) {
        pyFormData.append('durationSec', String(durationSec));
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout for video processing
      const pyResponse = await fetch(`${PYTHON_BACKEND_URL}/predict`, {
        method: 'POST',
        body: pyFormData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const pyData = await pyResponse.json().catch(() => ({}));
      if (!pyResponse.ok) {
        throw new Error(pyData.error || `ResNet-50 service returned status ${pyResponse.status}.`);
      }

      res.json({ prediction: pyData.prediction || pyData });
    } catch (err) {
      const isNetworkErr =
        err?.name === 'AbortError' ||
        err?.code === 'ECONNREFUSED' ||
        err?.message?.includes('fetch failed');

      if (isNetworkErr) {
        res.status(503).json({
          error:
            'ResNet-50 backend is not responding on port 5000. ' +
            'Please ensure the Python backend is running ("./start.sh" or "python3 backend/app.py").',
        });
        return;
      }

      res.status(500).json({ error: err.message || 'ResNet-50 inference failed.' });
    }
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;
    const message = error?.message || 'Unexpected error while analyzing the uploaded video.';
    res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

app.use((err, _req, res, next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'Video exceeds the 45.0 MB maximum file size.' });
    return;
  }
  if (err) {
    res.status(400).json({ error: err.message || 'Invalid video upload request.' });
    return;
  }
  next();
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DEKHTE HAIN server listening on http://0.0.0.0:${PORT}`);
    console.log(`Connected ResNet-50 Python backend URL: ${PYTHON_BACKEND_URL}`);
  });
}

startServer();
