import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RockEntry {
  name: string;
  type: string;
  category: 'igneous' | 'sedimentary' | 'metamorphic';
  color: string;
  grain: string;
  emoji: string;
  description: string;
}

const ROCK_CATALOG: RockEntry[] = [
  { name: 'Granite', type: 'Igneous - Intrusive', category: 'igneous', color: 'Light gray, white, pink', grain: 'Coarse', emoji: '🪨', description: 'Hard igneous rock composed of quartz, feldspar, and mica. Forms deep underground from slow cooling of magma.' },
  { name: 'Basalt', type: 'Igneous - Extrusive', category: 'igneous', color: 'Dark gray to black', grain: 'Fine', emoji: '🌋', description: 'Dark volcanic rock, the most common igneous rock. Forms from rapid cooling of lava at Earth\'s surface.' },
  { name: 'Limestone', type: 'Sedimentary', category: 'sedimentary', color: 'White, gray, tan', grain: 'Variable', emoji: '🐚', description: 'Composed of calcium carbonate from marine organisms. Widely used in construction and cement production.' },
  { name: 'Sandstone', type: 'Sedimentary', category: 'sedimentary', color: 'Tan, brown, red', grain: 'Medium', emoji: '🏜️', description: 'Formed from consolidated sand grains deposited in rivers, beaches, and deserts.' },
  { name: 'Shale', type: 'Sedimentary', category: 'sedimentary', color: 'Gray, black, brown', grain: 'Very fine', emoji: '📄', description: 'Most common sedimentary rock, formed from compressed mud and clay. Splits into thin layers.' },
  { name: 'Slate', type: 'Metamorphic', category: 'metamorphic', color: 'Gray, black, green', grain: 'Very fine', emoji: '🏫', description: 'Fine-grained metamorphic rock derived from shale. Known for splitting into flat sheets.' },
  { name: 'Marble', type: 'Metamorphic', category: 'metamorphic', color: 'White, pink, gray', grain: 'Medium crystalline', emoji: '🏛️', description: 'Recrystallized limestone prized for beauty. Used in art and architecture for millennia.' },
  { name: 'Quartzite', type: 'Metamorphic', category: 'metamorphic', color: 'White, gray, pink', grain: 'Medium crystalline', emoji: '💎', description: 'Hard rock formed from sandstone metamorphism. Composed almost entirely of quartz.' },
  { name: 'Gneiss', type: 'Metamorphic', category: 'metamorphic', color: 'Banded light/dark', grain: 'Medium to coarse', emoji: '🌀', description: 'High-grade metamorphic rock with distinctive banding. Forms under extreme heat and pressure.' },
  { name: 'Schist', type: 'Metamorphic', category: 'metamorphic', color: 'Silver, green, brown', grain: 'Medium to coarse', emoji: '✨', description: 'Medium-grade metamorphic rock with strong foliation and visible shiny mica minerals.' },
  { name: 'Diorite', type: 'Igneous - Intrusive', category: 'igneous', color: 'Medium gray', grain: 'Coarse', emoji: '⚪', description: 'Intrusive igneous rock with a characteristic salt-and-pepper appearance.' },
  { name: 'Pegmatite', type: 'Igneous - Intrusive', category: 'igneous', color: 'Variable', grain: 'Very coarse', emoji: '🔮', description: 'Igneous rock with exceptionally large crystals, often containing rare earth minerals.' },
  { name: 'Obsidian', type: 'Igneous - Volcanic Glass', category: 'igneous', color: 'Black, dark brown', grain: 'Glassy', emoji: '🖤', description: 'Volcanic glass formed from extremely rapid lava cooling. Has conchoidal fracture.' },
  { name: 'Pumice', type: 'Igneous - Volcanic', category: 'igneous', color: 'White, light gray', grain: 'Vesicular', emoji: '🫧', description: 'Extremely porous volcanic rock light enough to float on water.' },
  { name: 'Andesite', type: 'Igneous - Extrusive', category: 'igneous', color: 'Gray', grain: 'Fine', emoji: '🏔️', description: 'Intermediate volcanic rock common in subduction zone volcanoes. Named after the Andes.' },
  { name: 'Rhyolite', type: 'Igneous - Extrusive', category: 'igneous', color: 'Light gray, pink', grain: 'Fine', emoji: '🌸', description: 'Light-colored volcanic rock, the extrusive equivalent of granite.' },
  { name: 'Conglomerate', type: 'Sedimentary', category: 'sedimentary', color: 'Multicolored', grain: 'Coarse (rounded)', emoji: '🫘', description: 'Composed of rounded pebbles and gravel cemented together by minerals.' },
  { name: 'Breccia', type: 'Sedimentary', category: 'sedimentary', color: 'Variable', grain: 'Coarse (angular)', emoji: '🧩', description: 'Composed of angular rock fragments, indicating minimal water transport.' },
  { name: 'Tuff', type: 'Igneous - Pyroclastic', category: 'igneous', color: 'White, tan', grain: 'Fine to medium', emoji: '💨', description: 'Formed from compacted volcanic ash ejected during explosive eruptions.' },
  { name: 'Flint', type: 'Sedimentary', category: 'sedimentary', color: 'Black, dark gray', grain: 'Cryptocrystalline', emoji: '🔥', description: 'Hard cryptocrystalline quartz, one of humanity\'s first tool-making materials.' },
  { name: 'Chalk', type: 'Sedimentary', category: 'sedimentary', color: 'White', grain: 'Very fine', emoji: '🤍', description: 'Soft white rock composed of microscopic marine coccolithophore shells.' },
  { name: 'Dolomite', type: 'Sedimentary', category: 'sedimentary', color: 'White, gray, pink', grain: 'Fine to medium', emoji: '🏔️', description: 'Similar to limestone but with calcium magnesium carbonate composition.' },
  { name: 'Dunite', type: 'Igneous - Ultramafic', category: 'igneous', color: 'Green, olive', grain: 'Coarse', emoji: '🫒', description: 'Ultramafic rock composed mostly of olivine, formed deep in Earth\'s mantle.' },
  { name: 'Syenite', type: 'Igneous - Intrusive', category: 'igneous', color: 'Gray, pink', grain: 'Coarse', emoji: '🩷', description: 'Similar to granite but very low in quartz. Composed mainly of alkali feldspar.' },
  { name: 'Porphyry', type: 'Igneous', category: 'igneous', color: 'Variable', grain: 'Mixed', emoji: '🎨', description: 'Large crystals embedded in a fine-grained matrix, indicating two stages of cooling.' },
];

type Filter = 'all' | 'igneous' | 'sedimentary' | 'metamorphic';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  igneous: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  sedimentary: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700' },
  metamorphic: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
};

export const RockCatalog: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedRock, setExpandedRock] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredRocks = ROCK_CATALOG.filter(
    (rock) =>
      (filter === 'all' || rock.category === filter) &&
      (search === '' || rock.name.toLowerCase().includes(search.toLowerCase()) || rock.type.toLowerCase().includes(search.toLowerCase()))
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
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Rock Catalog</h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Explore the <span className="font-semibold text-amber-600">25 rock types</span> our AI can identify. Learn about their properties, formation, and uses.
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
            placeholder="Search rocks by name or type..."
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
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
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
                      <h3 className="font-bold text-gray-900 text-lg">{rock.name}</h3>
                    </div>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors.badge}`}>
                      {rock.type}
                    </span>
                    {!isExpanded && (
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{rock.description}</p>
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
                      <p className="text-gray-700 leading-relaxed mb-5">{rock.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className={`rounded-xl p-3.5 ${colors.bg}`}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Color</p>
                          <p className="text-sm font-medium text-gray-800">{rock.color}</p>
                        </div>
                        <div className={`rounded-xl p-3.5 ${colors.bg}`}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Grain Size</p>
                          <p className="text-sm font-medium text-gray-800">{rock.grain}</p>
                        </div>
                        <div className={`rounded-xl p-3.5 ${colors.bg}`}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</p>
                          <p className="text-sm font-medium text-gray-800 capitalize">{rock.category}</p>
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
          <p className="text-gray-400 text-lg">No rocks match your search.</p>
        </div>
      )}
    </div>
  );
};
