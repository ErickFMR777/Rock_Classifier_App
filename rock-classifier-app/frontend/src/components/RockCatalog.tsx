import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '../lib/i18n';
import { ui } from '../data/ui';
import { ROCK_CATALOG } from '../data/rocks';

type Filter = 'all' | 'igneous' | 'sedimentary' | 'metamorphic';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  igneous: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  sedimentary: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700' },
  metamorphic: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
};

export const RockCatalog: React.FC = () => {
  const { locale, t } = useLocale();
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedRock, setExpandedRock] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Match against the displayed name and type, plus the canonical English class
  // name, so searching "Granite" still works while browsing in Spanish.
  const needle = search.trim().toLowerCase();
  const filteredRocks = ROCK_CATALOG.filter(
    (rock) =>
      (filter === 'all' || rock.category === filter) &&
      (needle === '' ||
        rock.label[locale].toLowerCase().includes(needle) ||
        rock.type[locale].toLowerCase().includes(needle) ||
        rock.name.toLowerCase().includes(needle))
  );

  const counts = {
    all: ROCK_CATALOG.length,
    igneous: ROCK_CATALOG.filter((r) => r.category === 'igneous').length,
    sedimentary: ROCK_CATALOG.filter((r) => r.category === 'sedimentary').length,
    metamorphic: ROCK_CATALOG.filter((r) => r.category === 'metamorphic').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">{t(ui.catalog.title)}</h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          {t(ui.catalog.subtitleBefore)}
          <span className="font-semibold text-amber-600">{t(ui.catalog.subtitleHighlight)}</span>
          {t(ui.catalog.subtitleAfter)}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 space-y-4">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t(ui.catalog.searchPlaceholder)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'igneous', 'sedimentary', 'metamorphic'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t(ui.categories[f])}
              <span className={`ml-1.5 text-xs ${filter === f ? 'text-gray-400' : 'text-gray-400'}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Rock Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredRocks.map((rock, i) => {
            const colors = CATEGORY_COLORS[rock.category];
            const isExpanded = expandedRock === rock.name;
            return (
              <motion.div
                key={rock.name}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                onClick={() => setExpandedRock(isExpanded ? null : rock.name)}
                className={`relative bg-white rounded-2xl border ${colors.border} p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  isExpanded ? 'sm:col-span-2 lg:col-span-3 shadow-xl ring-2 ring-amber-400/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {rock.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-lg">{rock.label[locale]}</h3>
                    </div>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors.badge}`}>
                      {rock.type[locale]}
                    </span>
                    {!isExpanded && (
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{rock.description[locale]}</p>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-5 pt-5 border-t border-gray-100"
                    >
                      <p className="text-gray-700 leading-relaxed mb-5">{rock.description[locale]}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className={`rounded-xl p-3.5 ${colors.bg}`}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t(ui.catalog.color)}</p>
                          <p className="text-sm font-medium text-gray-800">{rock.color[locale]}</p>
                        </div>
                        <div className={`rounded-xl p-3.5 ${colors.bg}`}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t(ui.catalog.grainSize)}</p>
                          <p className="text-sm font-medium text-gray-800">{rock.grain[locale]}</p>
                        </div>
                        <div className={`rounded-xl p-3.5 ${colors.bg}`}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t(ui.catalog.category)}</p>
                          <p className="text-sm font-medium text-gray-800">{t(ui.categories[rock.category])}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredRocks.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">{t(ui.catalog.empty)}</p>
        </div>
      )}
    </div>
  );
};
