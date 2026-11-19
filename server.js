import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_VIDEO_SIZE_BYTES, validateVideoFile } from './src/lib/forensics.js';
import { analyzeVideoForDeepfake } from './src/server/geminiForensics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_SIZE_BYTES,
  },
});

app.get('/api/health', (_req, res) => {
  const key = process.env.GEMINI_API_KEY?.trim();
  res.json({
    ok: true,
    modelConfigured: Boolean(key && key !== 'MY_GEMINI_API_KEY'),
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

    const prediction = await analyzeVideoForDeepfake({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype || 'video/mp4',
      fileName: req.file.originalname,
      durationSec,
    });

    res.json({ prediction });
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;
    const message = error?.message || 'Unexpected error while analyzing the uploaded video.';

    if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
      res.status(403).json({
        error: 'The configured GEMINI_API_KEY was rejected. Please verify it in Settings > Secrets.',
      });
      return;
    }

    if (message.includes('RESOURCE_EXHAUSTED') || status === 429) {
      res.status(429).json({
        error: 'Model quota exceeded. Please wait a moment and retry, or check Settings > Secrets.',
      });
      return;
    }

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
  });
}

startServer();
