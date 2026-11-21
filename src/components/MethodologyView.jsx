const ENGINES = [
  {
    tag: 'LOCAL CNN',
    title: 'ResNet-50 (Celeb-DF v2 Model)',
    desc: 'Fine-tuned deep convolutional neural network trained on over 5,600 real and synthesized celebrity videos. Uniformly extracts 16 video keyframes, normalizes tensors, and calculates per-frame synthetic probabilities and temporal variance directly via PyTorch.',
    badge: 'Offline / Fast Edge Inference',
  },
  {
    tag: 'CLOUD MULTIMODAL',
    title: 'Gemini 4 Multimodal Forensics',
    desc: 'High-parameter multimodal reasoning model analyzing full-spectrum audio-visual integrity, perioral phoneme-to-viseme synchronization, directional specular reflections, and micro-expression stiffness with chronological timestamped citations.',
    badge: 'Deep Forensic Semantic Reasoning',
  },
];

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
    range: '0% – 35% Manipulation Risk',
    rule: 'Consistent physical illumination, stable temporal textures, and synchronized speech cues.',
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
    range: '65% – 100% Manipulation Risk',
    rule: 'Clear synthetic generation, localized face-swap blending, or audio-visual desynchronization.',
    toneClass: 'text-red-400',
  },
];

export function MethodologyView() {
  return (
    <section aria-label="Detection methodology" className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
          Detection Methodology & Dual Engines
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
          DEKHTE HAIN pairs a dedicated local PyTorch ResNet-50 computer vision pipeline with a cloud-scale multimodal forensic model, enabling both rapid offline verification and comprehensive media analysis.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Supported Detection Engines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ENGINES.map((eng) => (
            <div key={eng.title} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">
                    {eng.tag}
                  </span>
                  <span className="text-xs text-slate-400">{eng.badge}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-slate-50 mb-2">
                  {eng.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{eng.desc}</p>
              </div>
            </div>
          ))}
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
              <div className="min-w-[200px]">
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
