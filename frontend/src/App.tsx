import { useEffect, useState } from 'react';
import { Sidebar, type Page } from './components/Sidebar';
import { Topline } from './components/Topline';
import { Overview } from './components/Overview';
import { Analyze } from './components/Analyze';
import { Results } from './components/Results';
import { Archive } from './components/Archive';
import { checkBackendHealth, predictVideoFile } from './lib/api';
import type { InvestigationRecord, PredictionResult } from './lib/forensics';

const STORAGE_KEY = 'deeptrace_investigations_v2';

const INITIAL_INVESTIGATIONS: InvestigationRecord[] = [
  {
    id: 'case-01',
    name: 'interview_fragment_04.mp4',
    date: '19 MAY 2025',
    label: 'AUTHENTIC',
    score: '97.4%',
    tone: 'real',
    fileSize: 14200000,
    prediction: {
      verdict: 'AUTHENTIC',
      confidence: 97.4,
      manipulationProbability: 2.6,
      summary: 'Consistent facial texture and spatial boundary embeddings across all 20 sampled frames.',
      signals: {
        facialLipSync: 96.5,
        temporalCoherence: 95.8,
        lightingReflection: 98.1,
        audioVisualAlignment: 50.0,
      },
      findings: [
        {
          timestampSec: 2.4,
          category: 'Spatial Coherence',
          severity: 'low',
          observation: 'Natural facial landmarks verified on opening sequence.',
        },
      ],
      modelUsed: 'EfficientNet-B3 (efficientnet_b3_best.pth)',
      analyzedAt: '2025-05-19T14:32:00Z',
    },
  },
  {
    id: 'case-02',
    name: 'synthetic_address_v2.mov',
    date: '18 MAY 2025',
    label: 'MANIPULATED',
    score: '92.8%',
    tone: 'fake',
    fileSize: 22800000,
    prediction: {
      verdict: 'DEEPFAKE',
      confidence: 92.8,
      manipulationProbability: 92.8,
      summary: 'EfficientNet-B3 identified spatial manipulation artifacts across perioral and chin boundary regions.',
      signals: {
        facialLipSync: 18.2,
        temporalCoherence: 24.5,
        lightingReflection: 35.0,
        audioVisualAlignment: 50.0,
      },
      findings: [
        {
          timestampSec: 3.8,
          category: 'Facial Boundary Artifact',
          severity: 'high',
          observation: 'Synthetic manipulation pattern detected around mouth contour.',
        },
      ],
      modelUsed: 'EfficientNet-B3 (efficientnet_b3_best.pth)',
      analyzedAt: '2025-05-18T10:15:00Z',
    },
  },
  {
    id: 'case-03',
    name: 'field_recording_12.mp4',
    date: '17 MAY 2025',
    label: 'AUTHENTIC',
    score: '96.1%',
    tone: 'real',
    fileSize: 8400000,
    prediction: {
      verdict: 'AUTHENTIC',
      confidence: 96.1,
      manipulationProbability: 3.9,
      summary: 'High spatial consistency with natural illumination physics and stable temporal embeddings.',
      signals: {
        facialLipSync: 94.2,
        temporalCoherence: 97.0,
        lightingReflection: 95.3,
        audioVisualAlignment: 50.0,
      },
      findings: [],
      modelUsed: 'EfficientNet-B3 (efficientnet_b3_best.pth)',
      analyzedAt: '2025-05-17T08:20:00Z',
    },
  },
  {
    id: 'case-04',
    name: 'conference_capture.avi',
    date: '17 MAY 2025',
    label: 'MANIPULATED',
    score: '89.6%',
    tone: 'fake',
    fileSize: 31200000,
    prediction: {
      verdict: 'DEEPFAKE',
      confidence: 89.6,
      manipulationProbability: 89.6,
      summary: 'Temporal discontinuities and jawline warping detected during head turns.',
      signals: {
        facialLipSync: 25.0,
        temporalCoherence: 31.2,
        lightingReflection: 40.5,
        audioVisualAlignment: 50.0,
      },
      findings: [
        {
          timestampSec: 6.2,
          category: 'Spatial Inconsistency',
          severity: 'high',
          observation: 'Unnatural boundary blending along jawline.',
        },
      ],
      modelUsed: 'EfficientNet-B3 (efficientnet_b3_best.pth)',
      analyzedAt: '2025-05-17T16:45:00Z',
    },
  },
];

function loadSavedInvestigations(): InvestigationRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_INVESTIGATIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_INVESTIGATIONS;
  } catch {
    return INITIAL_INVESTIGATIONS;
  }
}

export default function App() {
  const [page, setPage] = useState<Page>('overview');
  const [menu, setMenu] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [currentRecord, setCurrentRecord] = useState<InvestigationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [investigations, setInvestigations] = useState<InvestigationRecord[]>(() =>
    loadSavedInvestigations()
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(investigations));
    } catch {}
  }, [investigations]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  // Periodic health check
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const res = await checkBackendHealth();
      if (mounted) {
        setIsBackendOnline(res.ok && Boolean(res.modelRunning ?? res.resnetRunning));
      }
    };
    check();
    const timer = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const go = (next: Page) => {
    setPage(next);
    setMenu(false);
    window.scrollTo(0, 0);
  };

  const handleSelectFile = (file: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const nextUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setVideoUrl(nextUrl);
    setCurrentPrediction(null);
    setCurrentRecord(null);
    setError(null);
    setProgress(0);
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;

    go('analyze');
    setIsAnalyzing(true);
    setError(null);
    setProgress(10);

    // Progress animation while awaiting backend response
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 88) return prev + Math.random() * 8 + 2;
        return prev;
      });
    }, 400);

    try {
      const pred = await predictVideoFile(selectedFile);
      clearInterval(progressTimer);
      setProgress(100);
      setCurrentPrediction(pred);

      const record: InvestigationRecord = {
        id: `case-${Date.now()}`,
        name: selectedFile.name,
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).toUpperCase(),
        label: pred.verdict === 'DEEPFAKE' ? 'MANIPULATED' : 'AUTHENTIC',
        score: `${pred.confidence.toFixed(1)}%`,
        tone: pred.verdict === 'DEEPFAKE' ? 'fake' : 'real',
        fileSize: selectedFile.size,
        prediction: pred,
        videoUrl: videoUrl || undefined,
      };

      setCurrentRecord(record);
      setInvestigations((prev) => [record, ...prev].slice(0, 40));

      // After brief completion display, transition to results
      setTimeout(() => {
        go('results');
      }, 1200);
    } catch (err: any) {
      clearInterval(progressTimer);
      setIsAnalyzing(false);
      setError(err?.message || 'Error communicating with EfficientNet-B3 backend.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewRecord = (record: InvestigationRecord) => {
    setCurrentRecord(record);
    setCurrentPrediction(record.prediction);
    go('results');
  };

  const handleNewInvestigation = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setSelectedFile(null);
    setVideoUrl(null);
    setCurrentPrediction(null);
    setCurrentRecord(null);
    setError(null);
    setProgress(0);
    go('overview');
  };

  const titles: Record<Page, string> = {
    overview: 'OVERVIEW',
    analyze: 'VIDEO ANALYSIS',
    results: 'DETECTION REPORT',
    archive: 'ARCHIVE',
  };

  return (
    <div className="app">
      <Sidebar
        page={page}
        go={go}
        open={menu}
        close={() => setMenu(false)}
        isOnline={isBackendOnline}
      />
      <main>
        <Topline title={titles[page]} onMenu={() => setMenu(true)} />

        {page === 'overview' && (
          <Overview
            go={go}
            onSelectFile={handleSelectFile}
            selectedFile={selectedFile}
            onStartAnalysis={handleStartAnalysis}
            investigations={investigations}
            onViewRecord={handleViewRecord}
            isBackendOnline={isBackendOnline}
          />
        )}

        {page === 'analyze' && (
          <Analyze
            go={go}
            selectedFile={selectedFile}
            videoUrl={videoUrl}
            isAnalyzing={isAnalyzing}
            progress={progress}
            prediction={currentPrediction}
            error={error}
            onRetry={handleStartAnalysis}
            isBackendOnline={isBackendOnline}
          />
        )}

        {page === 'results' && (
          <Results
            record={currentRecord}
            go={go}
            onNewInvestigation={handleNewInvestigation}
          />
        )}

        {page === 'archive' && (
          <Archive
            go={go}
            investigations={investigations}
            onViewRecord={handleViewRecord}
            onNewInvestigation={handleNewInvestigation}
          />
        )}

        <footer>
          <span>DEEPTRACE © 2026</span>
          <span>POWERED BY EFFICIENTNET-B3 (efficientnet_b3_best.pth)</span>
          <span>CELEB-DF V2 TRAINED MODEL</span>
        </footer>
      </main>
    </div>
  );
}
