import React from 'react';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const specs = [
  { label: 'Architecture', value: 'ResNet50', detail: '50-layer deep residual network' },
  { label: 'Pre-trained On', value: 'ImageNet', detail: '1.2M images, 1000 classes' },
  { label: 'Approach', value: 'Transfer Learning', detail: 'Fine-tuned for rock classification' },
  { label: 'Input Size', value: '224 x 224 px', detail: 'RGB images auto-resized' },
  { label: 'Output Classes', value: '25 Rock Types', detail: 'Igneous, sedimentary, metamorphic' },
  { label: 'Inference', value: '< 2 seconds', detail: 'On CPU (GitHub Codespaces)' },
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
  { step: '02', title: 'Process', description: 'The image is resized to 224x224 and normalized using ImageNet statistics.' },
  { step: '03', title: 'Classify', description: 'ResNet50 extracts features and predicts probabilities for each of the 25 rock types.' },
  { step: '04', title: 'Results', description: 'You receive the top match with confidence score, geological info, and 4 alternative matches.' },
];

interface AboutPageProps {
  onGoToClassifier: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onGoToClassifier }) => {
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

      {/* Accuracy & Limitations */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Accuracy & Performance
          </h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span><strong>Target accuracy:</strong> 85–92% on standard rock image datasets with proper training data.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span><strong>Confidence score:</strong> Each prediction includes a 0–100% confidence level so you know how certain the model is.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span><strong>Top-5 predictions:</strong> Returns up to 5 alternative matches ranked by probability.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span><strong>Inference speed:</strong> Under 2 seconds on a standard CPU environment.</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Limitations
          </h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Results depend on image quality — use well-lit, close-up, in-focus photos for best accuracy.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Limited to 25 rock types. Rocks outside this set may be misclassified as the closest match.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>This is a demonstration tool — always verify critical identifications with a geologist.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Similar-looking rocks (e.g. gneiss vs. schist) may have lower differentiation accuracy.</span>
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
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
              <span>Minimum resolution of 224x224 pixels — higher is better.</span>
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
