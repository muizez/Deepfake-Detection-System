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
          Detection Methodology
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
          Uploaded videos are evaluated end-to-end across four complementary forensic signal categories before calibrating a final prediction verdict.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DIMENSIONS.map((dim) => (
          <div key={dim.index} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-slate-50 mb-2">
              {dim.index} {dim.title}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">{dim.detail}</p>
          </div>
        ))}
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
