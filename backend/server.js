import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../frontend');
const distPath = path.resolve(frontendDir, 'dist');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:5000';

const MAX_VIDEO_SIZE_BYTES = 45 * 1024 * 1024; // 45 MB
const SUPPORTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/ogg',
];
const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv', '.ogv'];

function validateVideoFile(file) {
  if (!file || !file.name) {
    return { valid: false, reason: 'Please select a valid video file.' };
  }
  if (file.size <= 0) {
    return { valid: false, reason: 'The selected video file is empty (0 bytes).' };
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return { valid: false, reason: 'Video exceeds the 45 MB upload limit.' };
  }
  const normalizedType = (file.type || '').toLowerCase().split(';')[0].trim();
  const lowerName = file.name.toLowerCase();
  const hasSupportedMime = SUPPORTED_VIDEO_MIME_TYPES.includes(normalizedType);
  const hasSupportedExtension = SUPPORTED_VIDEO_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  if (!hasSupportedMime && !hasSupportedExtension) {
    return {
      valid: false,
      reason: 'Unsupported file format. Please upload an MP4, WebM, MOV, AVI, or MKV video.',
    };
  }
  return { valid: true };
}

app.use(express.json({ limit: '2mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_SIZE_BYTES,
  },
});

let pythonProcess = null;

async function ensurePythonBackend() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const pyRes = await fetch(`${PYTHON_BACKEND_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (pyRes.ok) {
      console.log(`[ResNet-50 Backend] Already active at ${PYTHON_BACKEND_URL}`);
      return;
    }
  } catch {}

  console.log(`[ResNet-50 Backend] Not responding on port 5000. Launching automatically...`);

  // Detect python executable
  const venvPy = path.resolve(__dirname, '../.venv/bin/python3');
  const anacondaPy = '/home/makintosh/anaconda3/bin/python';
  let pyBin = 'python3';
  if (fs.existsSync(venvPy)) {
    pyBin = venvPy;
  } else if (fs.existsSync(anacondaPy)) {
    pyBin = anacondaPy;
  }

  const appPyPath = path.resolve(__dirname, 'app.py');
  pythonProcess = spawn(pyBin, [appPyPath], {
    stdio: 'inherit',
    detached: false,
  });

  pythonProcess.on('error', (err) => {
    console.error(`[ResNet-50 Backend] Failed to spawn: ${err.message}`);
  });

  // Poll for up to 10 seconds for backend to finish loading model weights
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 800);
      const res = await fetch(`${PYTHON_BACKEND_URL}/health`, { signal: c.signal });
      clearTimeout(t);
      if (res.ok) {
        console.log(`[ResNet-50 Backend] Successfully online and verified!`);
        return;
      }
    } catch {}
  }
  console.warn(`[ResNet-50 Backend] Warning: Model is still initializing on port 5000.`);
}

app.get('/api/health', async (_req, res) => {
  let resnetRunning = false;
  let resnetDetails = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
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

    try {
      const pyFormData = new FormData();
      const fileBlob = new Blob([req.file.buffer], { type: req.file.mimetype || 'video/mp4' });
      pyFormData.append('video', fileBlob, req.file.originalname);
      if (durationSec) {
        pyFormData.append('durationSec', String(durationSec));
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout
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
        // Attempt quick revival if process died
        ensurePythonBackend().catch(() => {});
        res.status(503).json({
          error:
            'ResNet-50 backend is starting or not responding on port 5000. ' +
            'Backend initialization was triggered—please wait 5 seconds and retry.',
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
  await ensurePythonBackend();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: frontendDir,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DEEPTRACE server listening on http://0.0.0.0:${PORT}`);
    console.log(`Connected ResNet-50 Python backend: ${PYTHON_BACKEND_URL}`);
  });
}

// Clean up child process on exit
process.on('SIGINT', () => {
  if (pythonProcess) pythonProcess.kill();
  process.exit(0);
});
process.on('SIGTERM', () => {
  if (pythonProcess) pythonProcess.kill();
  process.exit(0);
});

startServer();
