import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getModelMetrics } from '../api/client';
import { RichText, useFormatters, useLocale } from '../lib/i18n';
import { ui } from '../data/ui';
import { rockLabel } from '../data/rocks';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

/**
 * Names and icons are locale-independent; the role text comes from `ui`.
 * Typing `name` as a key of `techRoles` makes an unlisted tool a build error
 * rather than a blank line under the icon.
 */
const techStack: { name: keyof typeof ui.about.techRoles.en; icon: string }[] = [
  { name: 'React 18', icon: '⚛️' },
  { name: 'TypeScript', icon: '🔷' },
  { name: 'Tailwind CSS', icon: '🎨' },
  { name: 'Framer Motion', icon: '🎬' },
  { name: 'FastAPI', icon: '⚡' },
  { name: 'PyTorch', icon: '🔥' },
  { name: 'TorchVision', icon: '👁️' },
  { name: 'Pillow', icon: '🖼️' },
];

// Real per-class metrics from training (val set, 163 samples)
const classMetrics: { name: string; precision: number; recall: number; f1: number; support: number; category: 'igneous' | 'sedimentary' | 'metamorphic' }[] = [
  { name: 'Andesite',      precision: 0.55, recall: 0.75, f1: 0.63, support: 8,  category: 'igneous' },
  { name: 'Basalt',        precision: 0.45, recall: 0.38, f1: 0.42, support: 13, category: 'igneous' },
  { name: 'Breccia',       precision: 1.00, recall: 0.17, f1: 0.29, support: 6,  category: 'sedimentary' },
  { name: 'Chalk',         precision: 0.67, recall: 0.25, f1: 0.36, support: 8,  category: 'sedimentary' },
  { name: 'Conglomerate',  precision: 0.50, recall: 0.60, f1: 0.55, support: 5,  category: 'sedimentary' },
  { name: 'Diorite',       precision: 0.33, recall: 0.33, f1: 0.33, support: 3,  category: 'igneous' },
  { name: 'Dolomite',      precision: 0.57, recall: 0.36, f1: 0.44, support: 11, category: 'sedimentary' },
  { name: 'Dunite',        precision: 0.33, recall: 0.50, f1: 0.40, support: 6,  category: 'igneous' },
  { name: 'Flint',         precision: 1.00, recall: 0.67, f1: 0.80, support: 3,  category: 'sedimentary' },
  { name: 'Gneiss',        precision: 0.00, recall: 0.00, f1: 0.00, support: 2,  category: 'metamorphic' },
  { name: 'Granite',       precision: 0.71, recall: 0.38, f1: 0.50, support: 13, category: 'igneous' },
  { name: 'Limestone',     precision: 0.38, recall: 0.60, f1: 0.46, support: 5,  category: 'sedimentary' },
  { name: 'Marble',        precision: 0.20, recall: 0.50, f1: 0.29, support: 4,  category: 'metamorphic' },
  { name: 'Obsidian',      precision: 0.71, recall: 1.00, f1: 0.83, support: 5,  category: 'igneous' },
  { name: 'Pegmatite',     precision: 0.67, recall: 0.36, f1: 0.47, support: 11, category: 'igneous' },
  { name: 'Porphyry',      precision: 0.50, recall: 0.17, f1: 0.25, support: 6,  category: 'igneous' },
  { name: 'Pumice',        precision: 0.33, recall: 0.50, f1: 0.40, support: 6,  category: 'igneous' },
  { name: 'Quartzite',     precision: 0.40, recall: 1.00, f1: 0.57, support: 4,  category: 'metamorphic' },
  { name: 'Rhyolite',      precision: 0.60, recall: 0.50, f1: 0.55, support: 6,  category: 'igneous' },
  { name: 'Sandstone',     precision: 0.56, recall: 0.62, f1: 0.59, support: 8,  category: 'sedimentary' },
  { name: 'Schist',        precision: 0.33, recall: 0.29, f1: 0.31, support: 7,  category: 'metamorphic' },
  { name: 'Shale',         precision: 0.33, recall: 0.17, f1: 0.22, support: 6,  category: 'sedimentary' },
  { name: 'Slate',         precision: 0.60, recall: 1.00, f1: 0.75, support: 6,  category: 'metamorphic' },
  { name: 'Syenite',       precision: 0.40, recall: 0.40, f1: 0.40, support: 5,  category: 'igneous' },
  { name: 'Tuff',          precision: 0.38, recall: 0.50, f1: 0.43, support: 6,  category: 'igneous' },
];

const categoryColors = {
  igneous: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bar: 'bg-red-500' },
  sedimentary: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', bar: 'bg-sky-500' },
  metamorphic: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', bar: 'bg-violet-500' },
};

function MetricBar({ value, color }: { value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

interface AboutPageProps {
  onGoToClassifier: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onGoToClassifier }) => {
  const { locale, t } = useLocale();
  const { percent, date } = useFormatters();
  const [metricSort, setMetricSort] = useState<'name' | 'f1' | 'recall'>('f1');
  const [metricFilter, setMetricFilter] = useState<'all' | 'igneous' | 'sedimentary' | 'metamorphic'>('all');
  const [remoteMetrics, setRemoteMetrics] = useState<any | null>(null);

  // If remote metrics are available, prefer them (falls back to bundled `classMetrics`).
  const existingMap = Object.fromEntries(classMetrics.map((m) => [m.name, m]));
  let displayedClassMetrics = classMetrics;
  if (remoteMetrics && remoteMetrics.classification_report && typeof remoteMetrics.classification_report === 'object') {
    displayedClassMetrics = Object.entries(remoteMetrics.classification_report).map(([name, stats]) => {
      const ex = existingMap[name];
      const precision = parseFloat((stats as any).precision || (stats as any)[0] || 0) || 0;
      const recall = parseFloat((stats as any).recall || (stats as any)[1] || 0) || 0;
      const f1 = parseFloat((stats as any).f1 || (stats as any)[2] || 0) || 0;
      const support = parseInt(String((stats as any).support || (stats as any)[3] || 0), 10) || 0;
      return { name, precision, recall, f1, support, category: ex ? ex.category : 'igneous' };
    });
  }

  // Dataset composition and confusion matrix come from the backend's
  // metrics.json; both are omitted when no backend is configured.
  const datasetCounts: Record<string, number> | null = remoteMetrics?.dataset_counts ?? null;
  const confusion: number[][] | null = remoteMetrics?.confusion_matrix ?? null;
  const confusionLabels: string[] = remoteMetrics?.confusion_matrix_labels ?? [];

  const hasLiveReport = Boolean(
    remoteMetrics?.classification_report &&
    Object.keys(remoteMetrics.classification_report).length > 0
  );
  const topk: Record<string, number> | null = remoteMetrics?.topk_accuracy ?? null;
  const macroAvg = remoteMetrics?.macro_avg ?? null;
  const weightedAvg = remoteMetrics?.weighted_avg ?? null;
  const trainedAt: string | null = remoteMetrics?.trained_at ?? null;
  const valSamples: number | null = remoteMetrics?.val_samples ?? null;
  const epochsRun: number | null = remoteMetrics?.epochs_run ?? null;

  const countsSorted = datasetCounts
    ? Object.entries(datasetCounts).sort((a, b) => a[1] - b[1])
    : [];
  const maxCount = countsSorted.length ? countsSorted[countsSorted.length - 1][1] : 0;
  const datasetTotal: number | null = remoteMetrics?.dataset_total ?? null;
  const thinClasses = countsSorted.filter(([, n]) => n < 40).map(([name]) => name);

  const sorted = [...displayedClassMetrics]
    .filter((m) => metricFilter === 'all' || m.category === metricFilter)
    .sort((a, b) => {
      if (metricSort === 'name')
        return rockLabel(a.name, locale).localeCompare(rockLabel(b.name, locale), locale);
      if (metricSort === 'f1') return b.f1 - a.f1;
      return b.recall - a.recall;
    });

  const avgPrecision = displayedClassMetrics.reduce((s, m) => s + m.precision, 0) / displayedClassMetrics.length;
  const avgRecall = displayedClassMetrics.reduce((s, m) => s + m.recall, 0) / displayedClassMetrics.length;
  const avgF1 = displayedClassMetrics.reduce((s, m) => s + m.f1, 0) / displayedClassMetrics.length;
  const totalSupport = displayedClassMetrics.reduce((s, m) => s + m.support, 0);
  const weightedAcc = totalSupport > 0
    ? displayedClassMetrics.reduce((s, m) => s + m.recall * m.support, 0) / totalSupport
    : avgRecall;

  // Fetch remote metrics on mount (non-blocking). Goes through the API client so it
  // honours VITE_API_URL; falls back to the bundled `classMetrics` when unavailable.
  useEffect(() => {
    let cancelled = false;
    getModelMetrics()
      .then((data) => {
        if (!cancelled && data) setRemoteMetrics(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <motion.div {...fadeUp} className="text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
          {t(ui.about.titleBefore)}<span className="text-amber-600">{ui.brandSuffix}</span>
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
          {t(ui.about.intro)}
        </p>
      </motion.div>

      {/* How it works */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 text-sm font-black">?</span>
          {t(ui.about.howItWorks)}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {t(ui.about.steps).map((s, i) => (
            <div key={s.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-3xl font-black bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h4 className="font-bold text-gray-900 mt-3 mb-2">{s.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Model Specs */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-violet-700 text-sm font-black">AI</span>
          {t(ui.about.specsTitle)}
        </h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {t(ui.about.specs).map((spec) => (
              <div key={spec.label} className="p-5 hover:bg-gray-50/60 transition-colors">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{spec.label}</p>
                <p className="text-lg font-bold text-gray-900">{spec.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{spec.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Training Details */}
      <motion.div {...fadeUp} transition={{ delay: 0.22 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 text-lg">🏋️</span>
          {t(ui.about.trainingTitle)}
        </h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {t(ui.about.training).map((td) => (
              <div key={td.label} className="p-5 hover:bg-gray-50/60 transition-colors">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{td.label}</p>
                <p className="text-lg font-bold text-gray-900">{td.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{td.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">{t(ui.about.techniquesLabel)}</strong>
            {t(ui.about.techniquesBody)}
          </p>
        </div>
      </motion.div>

      {/* Global Metrics Summary */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 text-lg">📊</span>
          {t(ui.about.performanceTitle)}
        </h3>
        {/* Provenance: says plainly whether these are live or bundled numbers */}
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          {/* Keyed off the per-class report specifically: a partial metrics.json
              must not claim the table below is live when it is still bundled. */}
          <span className={`inline-flex items-center gap-1.5 font-medium ${hasLiveReport ? 'text-emerald-700' : 'text-gray-500'}`}>
            <span className={`w-2 h-2 rounded-full ${hasLiveReport ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            {hasLiveReport ? t(ui.about.metricsLive) : t(ui.about.metricsBundled)}
          </span>
          {trainedAt && <span>{t(ui.about.trainedOn)(date(trainedAt))}</span>}
          {epochsRun !== null && <span>{t(ui.about.epochsRun)(epochsRun)}</span>}
          {valSamples !== null && <span>{t(ui.about.valSamples)(valSamples)}</span>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            // Prefer the accuracy the training run reported over one re-derived
            // from the per-class table, which rounds differently.
            { label: t(ui.about.overallAccuracy), value: remoteMetrics?.val_accuracy ?? weightedAcc, color: 'from-emerald-500 to-teal-600' },
            { label: t(ui.about.macroPrecision), value: macroAvg?.precision ?? avgPrecision, color: 'from-blue-500 to-indigo-600' },
            { label: t(ui.about.macroRecall), value: macroAvg?.recall ?? avgRecall, color: 'from-violet-500 to-purple-600' },
            { label: t(ui.about.macroF1), value: macroAvg?.f1 ?? avgF1, color: 'from-amber-500 to-orange-600' },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className={`text-3xl font-black bg-gradient-to-br ${m.color} bg-clip-text text-transparent`}>
                {percent(m.value)}
              </p>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Top-k: the app shows five candidates, so top-3/top-5 describe the
            experience far better than top-1 alone. */}
        {topk && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h4 className="font-bold text-gray-800 text-sm mb-1">{t(ui.about.topkTitle)}</h4>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              {t(ui.about.topkBody)}
            </p>
            <div className="grid grid-cols-3 gap-4">
              {([
                { k: 'top1', label: 'Top-1' },
                { k: 'top3', label: 'Top-3' },
                { k: 'top5', label: 'Top-5' },
              ] as const).map(({ k, label }) =>
                topk[k] !== undefined ? (
                  <div key={k} className="text-center">
                    <p className="text-2xl font-black text-gray-900">{percent(topk[k])}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
                    <p className="text-[11px] text-gray-400">{t(ui.about.topkNotes)[k]}</p>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* Macro vs weighted: the gap between them is the imbalance, made visible. */}
        {macroAvg && weightedAvg && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h4 className="font-bold text-gray-800 text-sm mb-1">{t(ui.about.macroWeightedTitle)}</h4>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              <RichText value={t(ui.about.macroWeightedBody)} />
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[320px]">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider">
                    <th className="text-left font-semibold pb-2">{t(ui.about.tableMetric)}</th>
                    <th className="text-right font-semibold pb-2">{t(ui.about.tableMacro)}</th>
                    <th className="text-right font-semibold pb-2">{t(ui.about.tableWeighted)}</th>
                    <th className="text-right font-semibold pb-2">{t(ui.about.tableGap)}</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    [t(ui.about.precision), macroAvg.precision, weightedAvg.precision],
                    [t(ui.about.recall), macroAvg.recall, weightedAvg.recall],
                    [t(ui.about.f1), macroAvg.f1, weightedAvg.f1],
                  ] as [string, number, number][]).map(([name, m, w]) => (
                    <tr key={name} className="border-t border-gray-100">
                      <td className="py-2 text-gray-700">{name}</td>
                      <td className="py-2 text-right font-mono text-gray-800">{percent(m)}</td>
                      <td className="py-2 text-right font-mono text-gray-800">{percent(w)}</td>
                      <td className={`py-2 text-right font-mono ${w - m > 0.08 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {w - m >= 0 ? '+' : ''}{((w - m) * 100).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <h4 className="font-bold text-gray-800 text-sm">{t(ui.about.perClassTitle)}</h4>
            <div className="flex-1" />
            <div className="flex gap-2 flex-wrap">
              {(['all', 'igneous', 'sedimentary', 'metamorphic'] as const).map((cat) => {
                const count = cat === 'all' ? classMetrics.length : classMetrics.filter(m => m.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setMetricFilter(cat)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      metricFilter === cat
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t(ui.categories[cat])} ({count})
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {([
                ['f1', t(ui.about.f1)],
                ['recall', t(ui.about.recall)],
                ['name', t(ui.about.sortAZ)],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMetricSort(key as any)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    metricSort === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px_50px] gap-2 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <span>{t(ui.about.colRockType)}</span>
            <span className="text-center">{t(ui.about.precision)}</span>
            <span className="text-center">{t(ui.about.recall)}</span>
            <span className="text-center">{t(ui.about.f1)}</span>
            <span className="text-center">n</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {sorted.map((m) => {
              const cat = categoryColors[m.category];
              const f1Color = m.f1 >= 0.6 ? 'bg-emerald-500' : m.f1 >= 0.35 ? 'bg-amber-500' : 'bg-red-400';
              return (
                <div key={m.name} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_100px_50px] gap-1 sm:gap-2 px-3 py-3 hover:bg-gray-50/60 transition-colors items-center">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${cat.bar}`} />
                    <span className="font-medium text-sm text-gray-800">{rockLabel(m.name, locale)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${cat.bg} ${cat.text} font-medium hidden sm:inline`}>
                      {t(ui.categories[m.category])}
                    </span>
                  </div>
                  <div className="sm:block">
                    <MetricBar value={m.precision} color="bg-blue-500" />
                  </div>
                  <div className="sm:block">
                    <MetricBar value={m.recall} color="bg-violet-500" />
                  </div>
                  <div className="sm:block">
                    <MetricBar value={m.f1} color={f1Color} />
                  </div>
                  <span className="text-xs text-gray-400 text-center font-mono">{m.support}</span>
                </div>
              );
            })}
          </div>

          {/* Footer summary */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_100px_50px] gap-2 px-3 py-3 mt-2 bg-gray-50 rounded-xl text-sm font-semibold">
            <span className="text-gray-700">
              {metricFilter === 'all'
                ? t(ui.about.macroAverage)
                : t(ui.about.categoryAverage)(t(ui.categories[metricFilter]))}
            </span>
            <span className="text-center text-blue-600">{(sorted.reduce((s, m) => s + m.precision, 0) / sorted.length * 100).toFixed(0)}%</span>
            <span className="text-center text-violet-600">{(sorted.reduce((s, m) => s + m.recall, 0) / sorted.length * 100).toFixed(0)}%</span>
            <span className="text-center text-amber-600">{(sorted.reduce((s, m) => s + m.f1, 0) / sorted.length * 100).toFixed(0)}%</span>
            <span className="text-center text-gray-500">{sorted.reduce((s, m) => s + m.support, 0)}</span>
          </div>
        </div>
      </motion.div>

      {/* Best & Worst performing */}
      <motion.div {...fadeUp} transition={{ delay: 0.28 }} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            {t(ui.about.bestTitle)}
          </h3>
          <div className="space-y-3">
            {[...classMetrics].sort((a, b) => b.f1 - a.f1).slice(0, 5).map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-800 text-xs font-bold">{i + 1}</span>
                <span className="flex-1 font-medium text-sm text-gray-800">{rockLabel(m.name, locale)}</span>
                <span className="text-sm font-bold text-emerald-700">{(m.f1 * 100).toFixed(0)}% F1</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {t(ui.about.worstTitle)}
          </h3>
          <div className="space-y-3">
            {[...classMetrics].sort((a, b) => a.f1 - b.f1).slice(0, 5).map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-amber-800 text-xs font-bold">{i + 1}</span>
                <span className="flex-1 font-medium text-sm text-gray-800">{rockLabel(m.name, locale)}</span>
                <span className="text-sm font-bold text-amber-700">{(m.f1 * 100).toFixed(0)}% F1</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">{t(ui.about.worstNote)}</p>
        </div>
      </motion.div>

      {/* Dataset composition & class balance */}
      <motion.div {...fadeUp} transition={{ delay: 0.28 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 text-lg">📦</span>
          {t(ui.about.datasetTitle)}
        </h3>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
          <p className="text-sm text-gray-600 leading-relaxed">{t(ui.about.datasetSourceBody)}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-900 leading-relaxed">
              <strong>{t(ui.about.datasetWarnLead)}</strong>
              {t(ui.about.datasetWarnBody)}
            </p>
          </div>

          {datasetCounts ? (
            <>
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t(ui.about.imagesPerClass)}
                </p>
                {datasetTotal !== null && (
                  <p className="text-xs text-gray-400">{t(ui.about.imagesTotal)(datasetTotal)}</p>
                )}
              </div>
              <div className="space-y-1.5">
                {countsSorted.map(([name, n]) => {
                  const pct = maxCount > 0 ? (n / maxCount) * 100 : 0;
                  const tone =
                    n < 25 ? 'bg-red-400' : n < 40 ? 'bg-amber-400' : 'bg-emerald-400';
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-24 flex-shrink-0 truncate">{rockLabel(name, locale)}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full ${tone} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-gray-500 w-8 text-right">{n}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> {t(ui.about.legendUnreliable)}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> {t(ui.about.legendWeak)}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> {t(ui.about.legendAcceptable)}</span>
              </div>
              {thinClasses.length > 0 && (
                <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                  <strong>{t(ui.about.thinLead)}</strong>{' '}
                  {thinClasses.map((n) => rockLabel(n, locale)).join(', ')}
                  {t(ui.about.thinBody)}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">{t(ui.about.datasetFallback)}</p>
          )}
        </div>
      </motion.div>

      {/* Confusion matrix */}
      {confusion && confusionLabels.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.29 }}>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-violet-700 text-lg">🔀</span>
            {t(ui.about.confusionTitle)}
          </h3>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">{t(ui.about.confusionBody)}</p>
            <p className="text-xs text-gray-500">{t(ui.about.confusionCaveat)}</p>

            <div className="overflow-x-auto">
              <table className="border-collapse" style={{ fontSize: '9px' }}>
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white z-10" />
                    {confusionLabels.map((l) => (
                      <th key={l} className="p-0 h-20 w-5 align-bottom">
                        <div
                          className="text-gray-500 whitespace-nowrap origin-bottom-left translate-x-3 -rotate-90 w-5"
                          style={{ transformOrigin: 'bottom left' }}
                        >
                          {rockLabel(l, locale)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {confusion.map((row, i) => {
                    const rowTotal = row.reduce((s, v) => s + v, 0);
                    return (
                      <tr key={confusionLabels[i]}>
                        <td className="sticky left-0 bg-white z-10 pr-2 text-right text-gray-600 whitespace-nowrap">
                          {rockLabel(confusionLabels[i], locale)}
                        </td>
                        {row.map((v, j) => {
                          const frac = rowTotal > 0 ? v / rowTotal : 0;
                          const diag = i === j;
                          const alpha = 0.15 + frac * 0.75;
                          const bg = v === 0
                            ? 'transparent'
                            : diag
                              ? `rgba(16,185,129,${alpha})`
                              : `rgba(239,68,68,${alpha})`;
                          // Dark ink is unreadable once the fill saturates.
                          const ink = v > 0 && alpha > 0.55 ? '#fff' : '#374151';
                          return (
                            <td
                              key={j}
                              title={t(ui.about.confusionCell)(
                                rockLabel(confusionLabels[i], locale),
                                rockLabel(confusionLabels[j], locale),
                                v,
                              )}
                              className="w-5 h-5 text-center border border-gray-100"
                              style={{ background: bg, color: ink }}
                            >
                              {v || ''}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> {t(ui.about.confusionLegendCorrect)}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> {t(ui.about.confusionLegendWrong)}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Limitations */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-700 text-lg">⚠️</span>
          {t(ui.about.limitationsTitle)}
        </h3>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <ul className="space-y-3 text-sm text-gray-700">
            {t(ui.about.limitations).map((item) => (
              <li key={item.label} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></span>
                <span><strong>{item.label}</strong> {item.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div {...fadeUp} transition={{ delay: 0.33 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center text-sky-700 text-lg">📷</span>
          {t(ui.about.tipsTitle)}
        </h3>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            {t(ui.about.tips).map((tip, i) => (
              <div key={tip} className="flex items-start gap-3">
                <span className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-xs font-bold flex-shrink-0">{i + 1}</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tech Stack */}
      <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-700 text-lg">⚙️</span>
          {t(ui.about.techTitle)}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {techStack.map((tech) => (
            <div key={tech.name} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
              <span className="text-2xl">{tech.icon}</span>
              <p className="font-semibold text-gray-900 text-sm mt-2">{tech.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t(ui.about.techRoles)[tech.name]}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="text-center pt-4 pb-8">
        <button
          onClick={onGoToClassifier}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {t(ui.about.cta)}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
};
