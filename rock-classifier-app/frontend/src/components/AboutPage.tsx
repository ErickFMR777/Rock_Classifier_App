import React, { useState } from 'react';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const specs = [
  { label: 'Architecture', value: 'ResNet18', detail: '18-layer deep residual network' },
  { label: 'Pre-trained On', value: 'ImageNet', detail: '1.2M images, 1000 classes' },
  { label: 'Approach', value: 'Transfer Learning', detail: 'Fine-tuned layers 3, 4 + FC head' },
  { label: 'Input Size', value: '224 × 224 px', detail: 'RGB images auto-resized' },
  { label: 'Output Classes', value: '25 Rock Types', detail: 'Igneous, sedimentary, metamorphic' },
  { label: 'Inference', value: '< 2 seconds', detail: 'CPU inference (no GPU required)' },
];

const trainingDetails = [
  { label: 'Dataset', value: '816 images', detail: '~30-80 per class, web-scraped' },
  { label: 'Epochs', value: '30', detail: 'Cosine Annealing w/ Warm Restarts' },
  { label: 'Batch Size', value: '8', detail: 'With 3× oversampling per epoch' },
  { label: 'Optimizer', value: 'AdamW', detail: 'Differential LRs: backbone 1e-4, FC 1e-3' },
  { label: 'Regularization', value: 'Multi-strategy', detail: 'Dropout 0.4, Label Smooth 0.1, Mixup' },
  { label: 'Train Time', value: '~125 min', detail: 'CPU-only (GitHub Codespaces)' },
];

const techStack = [
  { name: 'React 18', role: 'Frontend UI', icon: '⚛️' },
  { name: 'TypeScript', role: 'Type safety', icon: '🔷' },
  { name: 'Tailwind CSS', role: 'Styling', icon: '🎨' },
  { name: 'Framer Motion', role: 'Animations', icon: '🎬' },
  { name: 'FastAPI', role: 'Backend API', icon: '⚡' },
  { name: 'PyTorch', role: 'Deep Learning', icon: '🔥' },
  { name: 'TorchVision', role: 'Image Models', icon: '👁️' },
  { name: 'Pillow', role: 'Image Processing', icon: '🖼️' },
];

const steps = [
  { step: '01', title: 'Upload', description: 'Drag and drop or click to upload a rock photo (JPG, PNG, WebP up to 5 MB).' },
  { step: '02', title: 'Process', description: 'The image is resized to 224×224 and normalized using ImageNet statistics.' },
  { step: '03', title: 'Classify', description: 'ResNet18 extracts features and predicts probabilities for each of the 25 rock types.' },
  { step: '04', title: 'Results', description: 'You receive the top match with confidence score, geological info, and 4 alternative matches.' },
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
  const [metricSort, setMetricSort] = useState<'name' | 'f1' | 'recall'>('f1');
  const [metricFilter, setMetricFilter] = useState<'all' | 'igneous' | 'sedimentary' | 'metamorphic'>('all');

  const sorted = [...classMetrics]
    .filter(m => metricFilter === 'all' || m.category === metricFilter)
    .sort((a, b) => {
      if (metricSort === 'name') return a.name.localeCompare(b.name);
      if (metricSort === 'f1') return b.f1 - a.f1;
      return b.recall - a.recall;
    });

  const avgPrecision = classMetrics.reduce((s, m) => s + m.precision, 0) / classMetrics.length;
  const avgRecall = classMetrics.reduce((s, m) => s + m.recall, 0) / classMetrics.length;
  const avgF1 = classMetrics.reduce((s, m) => s + m.f1, 0) / classMetrics.length;
  const totalSupport = classMetrics.reduce((s, m) => s + m.support, 0);
  const weightedAcc = classMetrics.reduce((s, m) => s + m.recall * m.support, 0) / totalSupport;

  return (
    <div className="space-y-12">
      {/* Hero */}
      <motion.div {...fadeUp} className="text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
          About RockClassifier<span className="text-amber-600">.ai</span>
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
          An AI-powered tool that identifies rocks from photographs using deep learning.
          Built for geology students, field researchers, rock collectors, and anyone curious about the earth beneath their feet.
        </p>
      </motion.div>

      {/* How it works */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 text-sm font-black">?</span>
          How It Works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => (
            <div key={s.step} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-3xl font-black bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent">
                {s.step}
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
          Model Specifications
        </h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {specs.map((spec) => (
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
          Training Configuration
        </h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {trainingDetails.map((td) => (
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
            <strong className="text-gray-700">Techniques used:</strong> Transfer Learning (ImageNet → Rocks), Mixup Data Augmentation (α=0.2),
            Label Smoothing (0.1), Weighted Random Sampling for class balance, Cosine Annealing with Warm Restarts (T₀=10),
            Gradient Clipping (1.0), heavy geometric + color augmentations (rotation, affine, color jitter, Gaussian blur, random erasing).
          </p>
        </div>
      </motion.div>

      {/* Global Metrics Summary */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 text-lg">📊</span>
          Model Performance
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Overall Accuracy', value: weightedAcc, color: 'from-emerald-500 to-teal-600' },
            { label: 'Macro Precision', value: avgPrecision, color: 'from-blue-500 to-indigo-600' },
            { label: 'Macro Recall', value: avgRecall, color: 'from-violet-500 to-purple-600' },
            { label: 'Macro F1-Score', value: avgF1, color: 'from-amber-500 to-orange-600' },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className={`text-3xl font-black bg-gradient-to-br ${m.color} bg-clip-text text-transparent`}>
                {(m.value * 100).toFixed(1)}%
              </p>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <h4 className="font-bold text-gray-800 text-sm">Per-Class Metrics</h4>
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
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)} ({count})
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {([['f1', 'F1'], ['recall', 'Recall'], ['name', 'A-Z']] as const).map(([key, label]) => (
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
            <span>Rock Type</span>
            <span className="text-center">Precision</span>
            <span className="text-center">Recall</span>
            <span className="text-center">F1-Score</span>
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
                    <span className="font-medium text-sm text-gray-800">{m.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${cat.bg} ${cat.text} font-medium hidden sm:inline`}>
                      {m.category}
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
              {metricFilter === 'all' ? 'Macro Average' : `${metricFilter.charAt(0).toUpperCase() + metricFilter.slice(1)} Avg`}
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
            Best Performing Rocks
          </h3>
          <div className="space-y-3">
            {[...classMetrics].sort((a, b) => b.f1 - a.f1).slice(0, 5).map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-800 text-xs font-bold">{i + 1}</span>
                <span className="flex-1 font-medium text-sm text-gray-800">{m.name}</span>
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
            Most Challenging Rocks
          </h3>
          <div className="space-y-3">
            {[...classMetrics].sort((a, b) => a.f1 - b.f1).slice(0, 5).map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-amber-800 text-xs font-bold">{i + 1}</span>
                <span className="flex-1 font-medium text-sm text-gray-800">{m.name}</span>
                <span className="text-sm font-bold text-amber-700">{(m.f1 * 100).toFixed(0)}% F1</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Low scores are mainly due to the small dataset (~30 images per class) and visual similarity between certain rock types.
          </p>
        </div>
      </motion.div>

      {/* Limitations */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-700 text-lg">⚠️</span>
          Limitations
        </h3>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></span>
              <span><strong>Small dataset:</strong> Only ~30 web-scraped images per class. More diverse, curated data would significantly improve accuracy.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></span>
              <span><strong>Visual similarity:</strong> Rocks like Gneiss vs. Schist, Chalk vs. Limestone share visual features, leading to confusion.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></span>
              <span><strong>Limited to 25 types:</strong> Rocks outside this catalogue will be misclassified as the closest match.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></span>
              <span><strong>Demonstration tool:</strong> Not for professional geological assessments — always verify with a specialist.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></span>
              <span><strong>Image quality dependent:</strong> Blurry, dark, or distant photos will produce unreliable results.</span>
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div {...fadeUp} transition={{ delay: 0.33 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center text-sky-700 text-lg">📷</span>
          Tips for Best Results
        </h3>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-xs font-bold flex-shrink-0">1</span>
              <span>Use natural, diffused lighting — avoid harsh shadows or flash.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-xs font-bold flex-shrink-0">2</span>
              <span>Photograph both fresh and weathered surfaces when possible.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-xs font-bold flex-shrink-0">3</span>
              <span>Include a scale reference (coin, pen) nearby for context.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-xs font-bold flex-shrink-0">4</span>
              <span>Keep the rock centered and fill the frame as much as possible.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-xs font-bold flex-shrink-0">5</span>
              <span>A plain background (white paper, flat surface) reduces noise.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-xs font-bold flex-shrink-0">6</span>
              <span>Minimum resolution of 224×224 pixels — higher is better.</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tech Stack */}
      <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-700 text-lg">⚙️</span>
          Technology Stack
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {techStack.map((tech) => (
            <div key={tech.name} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
              <span className="text-2xl">{tech.icon}</span>
              <p className="font-semibold text-gray-900 text-sm mt-2">{tech.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{tech.role}</p>
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
          Try It Now
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
};
