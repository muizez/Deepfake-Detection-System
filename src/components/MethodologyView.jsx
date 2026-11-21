const MODEL_SPEC = {
  tag: 'PYTORCH CNN',
  title: 'ResNet-50 (resnet50-balanced-best.pth)',
  desc: 'Fine-tuned 50-layer deep residual neural network trained on balanced Celeb-DF v2 datasets. Extracts 20 uniform keyframes across video duration, transforms frames into 224x224 RGB normalized tensors, and evaluates binary logits across FAKE and REAL classes using an optimized 0.30 decision threshold.',
  badge: 'Offline / Fast Edge Inference',
};

const DIMENSIONS = [
  {
    index: '01.',
    title: 'Facial & Lip-Sync Integrity',
    detail:
      'Inspects perioral blending halos, teeth sharpness consistency, jaw contour warping, and unnatural micro-expression stiffness during rapid speech.',
  },
  {
    index: '02.',
    title: 'Temporal Frame Coherence',
    detail:
      'Tracks frame-to-frame identity drift, high-frequency skin shimmer across head turns, and boundary flicker along hairlines, glasses, and collars.',
  },
  {
    index: '03.',
    title: 'Illumination & Skin Physics',
    detail:
      'Compares corneal catchlights, directional facial shadow geometry, and skin pore micro-texture against surrounding background compression.',
  },
  {
    index: '04.',
    title: 'Audio-Visual Phoneme Sync',
    detail:
      'Evaluates temporal alignment between bilabial or plosive speech transients and mouth closure frames alongside vocal cadence continuity.',
  },
];

const THRESHOLDS = [
  {
    label: 'Authentic Media',
    range: '0% – 35% Manipulation Risk (Real Prob ≥ 30%)',
    rule: 'Consistent physical illumination, stable temporal textures, and natural facial features matching authentic training distributions.',
    toneClass: 'text-emerald-400',
  },
  {
    label: 'Inconclusive Review',
    range: '36% – 64% Manipulation Risk',
    rule: 'Heavy re-encoding, low resolution, or mixed cues that require original source verification.',
    toneClass: 'text-amber-400',
  },
  {
    label: 'Deepfake Detected',
    range: '65% – 100% Manipulation Risk (Real Prob < 30%)',
    rule: 'Clear synthetic generation, localized face-swap blending, boundary artifacts, or temporal instability.',
    toneClass: 'text-red-400',
  },
];

export function MethodologyView() {
  return (
    <section aria-label="Detection methodology" className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
          Detection Methodology & ResNet-50 Architecture
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
          DEKHTE HAIN uses the balanced ResNet-50 deepfake detection model (<span className="font-mono text-blue-300">resnet50-balanced-best.pth</span>) trained with PyTorch on the Celeb-DF v2 dataset to deliver fast, highly accurate, and privacy-preserving offline inference.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Model Architecture & Inference Pipeline
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">
              {MODEL_SPEC.tag}
            </span>
            <span className="text-xs text-slate-400">{MODEL_SPEC.badge}</span>
          </div>
          <h3 className="font-display text-lg font-semibold text-slate-50 mb-2">
            {MODEL_SPEC.title}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">{MODEL_SPEC.desc}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block mb-1">Input Resolution</span>
              <span className="font-mono text-slate-100 font-semibold">224 × 224 RGB</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block mb-1">Temporal Sampling</span>
              <span className="font-mono text-slate-100 font-semibold">20 Evenly Spaced Frames</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block mb-1">Decision Threshold</span>
              <span className="font-mono text-slate-100 font-semibold">0.30 Real Probability</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Evaluated Forensic Dimensions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DIMENSIONS.map((dim) => (
            <div key={dim.index} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-display text-base font-semibold text-slate-50 mb-2">
                {dim.index} {dim.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">{dim.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-slate-50 mb-4">
          Verdict Calibration Thresholds
        </h2>
        <div className="divide-y divide-slate-800">
          {THRESHOLDS.map((item) => (
            <div
              key={item.label}
              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6"
            >
              <div className="min-w-[220px]">
                <span className={`text-sm font-semibold ${item.toneClass}`}>{item.label}</span>
                <div className="text-xs font-mono tabular-nums text-slate-400 mt-0.5">
                  {item.range}
                </div>
              </div>
              <p className="text-sm text-slate-300 flex-1">{item.rule}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
