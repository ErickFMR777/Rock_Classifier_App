import React from 'react';
import { motion } from 'framer-motion';
import { ClassificationResult as IClassificationResult } from '../types';
import { useFormatters, useLocale } from '../lib/i18n';
import { ui } from '../data/ui';
import { ROCK_GEOLOGY_ES, rockLabel } from '../data/rocks';

interface Props {
  result: IClassificationResult;
}

const getConfidenceColor = (c: number) => {
  if (c >= 0.8) return 'from-emerald-500 to-green-500';
  if (c >= 0.5) return 'from-amber-500 to-orange-500';
  return 'from-red-400 to-orange-400';
};

export const ClassificationResult: React.FC<Props> = ({ result }) => {
  const { locale, t } = useLocale();
  const { percent } = useFormatters();
  // Defaulted rather than destructured bare: a malformed response would
  // otherwise throw here and blank the whole page instead of the one card.
  const { primary, inference_time_ms } = result;
  const alternatives = result.alternatives ?? [];
  const confColor = getConfidenceColor(primary.confidence);

  const confidenceLabel =
    primary.confidence >= 0.8
      ? t(ui.result.confidenceHigh)
      : primary.confidence >= 0.5
        ? t(ui.result.confidenceModerate)
        : t(ui.result.confidenceLow);

  // The API enriches predictions from `api/_lib/rocks.json`, which is English.
  // In Spanish, overlay the local translation and fall back to the API text for
  // anything it does not cover; in English the response is used untouched.
  const es = locale === 'es' ? ROCK_GEOLOGY_ES[primary.class] : undefined;
  const geo = {
    type: es?.type ?? primary.type,
    color: es?.color ?? primary.color,
    grainSize: es?.grain_size ?? primary.grain_size,
    minerals: es?.mineral_composition ?? primary.mineral_composition,
    formation: es?.formation ?? primary.formation,
    uses: es?.uses ?? primary.uses,
    description: es?.description ?? primary.description,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Primary Result Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header Band */}
        <div className={`h-1.5 bg-gradient-to-r ${confColor}`} />

        <div className="p-6">
          {/* Name & Confidence */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{t(ui.result.identifiedAs)}</p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900">{rockLabel(primary.class, locale)}</h2>
              {geo.type && (
                <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                  {geo.type}
                </span>
              )}
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <p className={`text-4xl sm:text-5xl font-black bg-gradient-to-r ${confColor} bg-clip-text text-transparent`}>
                {percent(primary.confidence)}
              </p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{confidenceLabel}</p>
            </div>
          </div>

          {/* Confidence Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${primary.confidence * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${confColor} rounded-full`}
            />
          </div>

          {/* Description */}
          {geo.description && (
            <p className="text-gray-600 leading-relaxed mb-6">{geo.description}</p>
          )}

          {/* Properties */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {geo.color && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t(ui.result.color)}</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{geo.color}</p>
              </div>
            )}
            {geo.grainSize && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t(ui.result.grainSize)}</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{geo.grainSize}</p>
              </div>
            )}
            {geo.minerals && geo.minerals.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t(ui.result.minerals)}</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{geo.minerals.join(', ')}</p>
              </div>
            )}
          </div>

          {/* Formation & Uses side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {geo.formation && geo.formation.length > 0 && (
              <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100">
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2.5">{t(ui.result.formation)}</h4>
                <ul className="space-y-1.5">
                  {geo.formation.map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {geo.uses && geo.uses.length > 0 && (
              <div className="bg-sky-50/60 rounded-xl p-4 border border-sky-100">
                <h4 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-2.5">{t(ui.result.uses)}</h4>
                <ul className="space-y-1.5">
                  {geo.uses.map((use, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="w-1 h-1 bg-sky-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      {use}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alternative Matches */}
      {alternatives.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            {t(ui.result.alternatives)}
          </h3>
          <div className="space-y-2">
            {alternatives.map((alt, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono w-4">{i + 2}</span>
                  <span className="font-medium text-gray-800 text-sm">{rockLabel(alt.class, locale)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${alt.confidence * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.08 }}
                      className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500 w-12 text-right">{percent(alt.confidence)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Meta */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 font-medium">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          {inference_time_ms}ms
        </span>
        <span>ResNet18</span>
        <span>{t(ui.result.topPredictions)}</span>
      </div>
    </motion.div>
  );
};
