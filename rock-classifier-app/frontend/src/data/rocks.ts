/**
 * Rock content for the frontend, in both locales.
 *
 * Two separate tables, because they answer to two different sources:
 *
 * - `ROCK_CATALOG` is the catalogue page's own copy. It already lived here as a
 *   hardcoded English array (with emoji and category, which the API does not
 *   carry); this only adds the Spanish side. The English strings are unchanged.
 *
 * - `ROCK_GEOLOGY_ES` is a Spanish overlay for the geology the API returns with
 *   a prediction. `api/_lib/rocks.json` stays the single source and stays
 *   English — deliberately not duplicated here, so there is no second English
 *   copy to drift. In English the result card renders the API response
 *   untouched; in Spanish it renders this overlay, falling back to the API
 *   text for anything missing.
 *
 * Keys are the canonical class names from `rock_classes.json`, which is also
 * the model's logit order.
 */

import type { Localized } from '../lib/i18n'

export type RockCategory = 'igneous' | 'sedimentary' | 'metamorphic'

export interface CatalogEntry {
  /** Canonical class name — matches rock_classes.json and the API. */
  name: string
  label: Localized<string>
  type: Localized<string>
  category: RockCategory
  color: Localized<string>
  grain: Localized<string>
  emoji: string
  description: Localized<string>
}

export const ROCK_CATALOG: CatalogEntry[] = [
  {
    name: 'Granite',
    label: { es: 'Granito', en: 'Granite' },
    type: { es: 'Ígnea - Intrusiva', en: 'Igneous - Intrusive' },
    category: 'igneous',
    color: { es: 'Gris claro, blanco, rosa', en: 'Light gray, white, pink' },
    grain: { es: 'Grueso', en: 'Coarse' },
    emoji: '🪨',
    description: {
      es: 'Roca ígnea dura compuesta de cuarzo, feldespato y mica. Se forma en profundidad por el enfriamiento lento del magma.',
      en: 'Hard igneous rock composed of quartz, feldspar, and mica. Forms deep underground from slow cooling of magma.',
    },
  },
  {
    name: 'Basalt',
    label: { es: 'Basalto', en: 'Basalt' },
    type: { es: 'Ígnea - Extrusiva', en: 'Igneous - Extrusive' },
    category: 'igneous',
    color: { es: 'Gris oscuro a negro', en: 'Dark gray to black' },
    grain: { es: 'Fino', en: 'Fine' },
    emoji: '🌋',
    description: {
      es: 'Roca volcánica oscura, la roca ígnea más común. Se forma por el enfriamiento rápido de la lava en la superficie.',
      en: "Dark volcanic rock, the most common igneous rock. Forms from rapid cooling of lava at Earth's surface.",
    },
  },
  {
    name: 'Limestone',
    label: { es: 'Caliza', en: 'Limestone' },
    type: { es: 'Sedimentaria', en: 'Sedimentary' },
    category: 'sedimentary',
    color: { es: 'Blanco, gris, beige', en: 'White, gray, tan' },
    grain: { es: 'Variable', en: 'Variable' },
    emoji: '🐚',
    description: {
      es: 'Compuesta de carbonato de calcio de origen marino. Muy usada en construcción y en la producción de cemento.',
      en: 'Composed of calcium carbonate from marine organisms. Widely used in construction and cement production.',
    },
  },
  {
    name: 'Sandstone',
    label: { es: 'Arenisca', en: 'Sandstone' },
    type: { es: 'Sedimentaria', en: 'Sedimentary' },
    category: 'sedimentary',
    color: { es: 'Beige, marrón, rojo', en: 'Tan, brown, red' },
    grain: { es: 'Medio', en: 'Medium' },
    emoji: '🏜️',
    description: {
      es: 'Formada por granos de arena consolidados, depositados en ríos, playas y desiertos.',
      en: 'Formed from consolidated sand grains deposited in rivers, beaches, and deserts.',
    },
  },
  {
    name: 'Shale',
    label: { es: 'Lutita', en: 'Shale' },
    type: { es: 'Sedimentaria', en: 'Sedimentary' },
    category: 'sedimentary',
    color: { es: 'Gris, negro, marrón', en: 'Gray, black, brown' },
    grain: { es: 'Muy fino', en: 'Very fine' },
    emoji: '📄',
    description: {
      es: 'La roca sedimentaria más común, formada por lodo y arcilla compactados. Se parte en capas delgadas.',
      en: 'Most common sedimentary rock, formed from compressed mud and clay. Splits into thin layers.',
    },
  },
  {
    name: 'Slate',
    label: { es: 'Pizarra', en: 'Slate' },
    type: { es: 'Metamórfica', en: 'Metamorphic' },
    category: 'metamorphic',
    color: { es: 'Gris, negro, verde', en: 'Gray, black, green' },
    grain: { es: 'Muy fino', en: 'Very fine' },
    emoji: '🏫',
    description: {
      es: 'Roca metamórfica de grano fino derivada de la lutita. Conocida por partirse en láminas planas.',
      en: 'Fine-grained metamorphic rock derived from shale. Known for splitting into flat sheets.',
    },
  },
  {
    name: 'Marble',
    label: { es: 'Mármol', en: 'Marble' },
    type: { es: 'Metamórfica', en: 'Metamorphic' },
    category: 'metamorphic',
    color: { es: 'Blanco, rosa, gris', en: 'White, pink, gray' },
    grain: { es: 'Cristalino medio', en: 'Medium crystalline' },
    emoji: '🏛️',
    description: {
      es: 'Caliza recristalizada, apreciada por su belleza. Usada en arte y arquitectura desde hace milenios.',
      en: 'Recrystallized limestone prized for beauty. Used in art and architecture for millennia.',
    },
  },
  {
    name: 'Quartzite',
    label: { es: 'Cuarcita', en: 'Quartzite' },
    type: { es: 'Metamórfica', en: 'Metamorphic' },
    category: 'metamorphic',
    color: { es: 'Blanco, gris, rosa', en: 'White, gray, pink' },
    grain: { es: 'Cristalino medio', en: 'Medium crystalline' },
    emoji: '💎',
    description: {
      es: 'Roca dura formada por metamorfismo de arenisca. Compuesta casi por completo de cuarzo.',
      en: 'Hard rock formed from sandstone metamorphism. Composed almost entirely of quartz.',
    },
  },
  {
    name: 'Gneiss',
    label: { es: 'Gneis', en: 'Gneiss' },
    type: { es: 'Metamórfica', en: 'Metamorphic' },
    category: 'metamorphic',
    color: { es: 'Bandeado claro/oscuro', en: 'Banded light/dark' },
    grain: { es: 'Medio a grueso', en: 'Medium to coarse' },
    emoji: '🌀',
    description: {
      es: 'Roca metamórfica de alto grado con bandeado característico. Se forma bajo calor y presión extremos.',
      en: 'High-grade metamorphic rock with distinctive banding. Forms under extreme heat and pressure.',
    },
  },
  {
    name: 'Schist',
    label: { es: 'Esquisto', en: 'Schist' },
    type: { es: 'Metamórfica', en: 'Metamorphic' },
    category: 'metamorphic',
    color: { es: 'Plateado, verde, marrón', en: 'Silver, green, brown' },
    grain: { es: 'Medio a grueso', en: 'Medium to coarse' },
    emoji: '✨',
    description: {
      es: 'Roca metamórfica de grado medio con foliación marcada y micas brillantes visibles.',
      en: 'Medium-grade metamorphic rock with strong foliation and visible shiny mica minerals.',
    },
  },
  {
    name: 'Diorite',
    label: { es: 'Diorita', en: 'Diorite' },
    type: { es: 'Ígnea - Intrusiva', en: 'Igneous - Intrusive' },
    category: 'igneous',
    color: { es: 'Gris medio', en: 'Medium gray' },
    grain: { es: 'Grueso', en: 'Coarse' },
    emoji: '⚪',
    description: {
      es: 'Roca ígnea intrusiva con el aspecto característico de "sal y pimienta".',
      en: 'Intrusive igneous rock with a characteristic salt-and-pepper appearance.',
    },
  },
  {
    name: 'Pegmatite',
    label: { es: 'Pegmatita', en: 'Pegmatite' },
    type: { es: 'Ígnea - Intrusiva', en: 'Igneous - Intrusive' },
    category: 'igneous',
    color: { es: 'Variable', en: 'Variable' },
    grain: { es: 'Muy grueso', en: 'Very coarse' },
    emoji: '🔮',
    description: {
      es: 'Roca ígnea con cristales excepcionalmente grandes, a menudo con minerales de tierras raras.',
      en: 'Igneous rock with exceptionally large crystals, often containing rare earth minerals.',
    },
  },
  {
    name: 'Obsidian',
    label: { es: 'Obsidiana', en: 'Obsidian' },
    type: { es: 'Ígnea - Vidrio volcánico', en: 'Igneous - Volcanic Glass' },
    category: 'igneous',
    color: { es: 'Negro, marrón oscuro', en: 'Black, dark brown' },
    grain: { es: 'Vítreo', en: 'Glassy' },
    emoji: '🖤',
    description: {
      es: 'Vidrio volcánico formado por enfriamiento extremadamente rápido de la lava. Presenta fractura concoidea.',
      en: 'Volcanic glass formed from extremely rapid lava cooling. Has conchoidal fracture.',
    },
  },
  {
    name: 'Pumice',
    label: { es: 'Pómez', en: 'Pumice' },
    type: { es: 'Ígnea - Volcánica', en: 'Igneous - Volcanic' },
    category: 'igneous',
    color: { es: 'Blanco, gris claro', en: 'White, light gray' },
    grain: { es: 'Vesicular', en: 'Vesicular' },
    emoji: '🫧',
    description: {
      es: 'Roca volcánica extremadamente porosa, tan ligera que flota en el agua.',
      en: 'Extremely porous volcanic rock light enough to float on water.',
    },
  },
  {
    name: 'Andesite',
    label: { es: 'Andesita', en: 'Andesite' },
    type: { es: 'Ígnea - Extrusiva', en: 'Igneous - Extrusive' },
    category: 'igneous',
    color: { es: 'Gris', en: 'Gray' },
    grain: { es: 'Fino', en: 'Fine' },
    emoji: '🏔️',
    description: {
      es: 'Roca volcánica intermedia, común en volcanes de zonas de subducción. Debe su nombre a los Andes.',
      en: 'Intermediate volcanic rock common in subduction zone volcanoes. Named after the Andes.',
    },
  },
  {
    name: 'Rhyolite',
    label: { es: 'Riolita', en: 'Rhyolite' },
    type: { es: 'Ígnea - Extrusiva', en: 'Igneous - Extrusive' },
    category: 'igneous',
    color: { es: 'Gris claro, rosa', en: 'Light gray, pink' },
    grain: { es: 'Fino', en: 'Fine' },
    emoji: '🌸',
    description: {
      es: 'Roca volcánica de color claro, el equivalente extrusivo del granito.',
      en: 'Light-colored volcanic rock, the extrusive equivalent of granite.',
    },
  },
  {
    name: 'Conglomerate',
    label: { es: 'Conglomerado', en: 'Conglomerate' },
    type: { es: 'Sedimentaria', en: 'Sedimentary' },
    category: 'sedimentary',
    color: { es: 'Multicolor', en: 'Multicolored' },
    grain: { es: 'Grueso (redondeado)', en: 'Coarse (rounded)' },
    emoji: '🫘',
    description: {
      es: 'Compuesta de guijarros y grava redondeados, cementados entre sí por minerales.',
      en: 'Composed of rounded pebbles and gravel cemented together by minerals.',
    },
  },
  {
    name: 'Breccia',
    label: { es: 'Brecha', en: 'Breccia' },
    type: { es: 'Sedimentaria', en: 'Sedimentary' },
    category: 'sedimentary',
    color: { es: 'Variable', en: 'Variable' },
    grain: { es: 'Grueso (anguloso)', en: 'Coarse (angular)' },
    emoji: '🧩',
    description: {
      es: 'Compuesta de fragmentos angulosos de roca, lo que indica muy poco transporte por agua.',
      en: 'Composed of angular rock fragments, indicating minimal water transport.',
    },
  },
  {
    name: 'Tuff',
    label: { es: 'Toba', en: 'Tuff' },
    type: { es: 'Ígnea - Piroclástica', en: 'Igneous - Pyroclastic' },
    category: 'igneous',
    color: { es: 'Blanco, beige', en: 'White, tan' },
    grain: { es: 'Fino a medio', en: 'Fine to medium' },
    emoji: '💨',
    description: {
      es: 'Formada por ceniza volcánica compactada, expulsada durante erupciones explosivas.',
      en: 'Formed from compacted volcanic ash ejected during explosive eruptions.',
    },
  },
  {
    name: 'Flint',
    label: { es: 'Sílex', en: 'Flint' },
    type: { es: 'Sedimentaria', en: 'Sedimentary' },
    category: 'sedimentary',
    color: { es: 'Negro, gris oscuro', en: 'Black, dark gray' },
    grain: { es: 'Criptocristalino', en: 'Cryptocrystalline' },
    emoji: '🔥',
    description: {
      es: 'Cuarzo criptocristalino duro, uno de los primeros materiales que la humanidad usó para fabricar herramientas.',
      en: "Hard cryptocrystalline quartz, one of humanity's first tool-making materials.",
    },
  },
  {
    name: 'Chalk',
    label: { es: 'Creta', en: 'Chalk' },
    type: { es: 'Sedimentaria', en: 'Sedimentary' },
    category: 'sedimentary',
    color: { es: 'Blanco', en: 'White' },
    grain: { es: 'Muy fino', en: 'Very fine' },
    emoji: '🤍',
    description: {
      es: 'Roca blanca y blanda compuesta de conchas microscópicas de cocolitofóridos marinos.',
      en: 'Soft white rock composed of microscopic marine coccolithophore shells.',
    },
  },
  {
    name: 'Dolomite',
    label: { es: 'Dolomía', en: 'Dolomite' },
    type: { es: 'Sedimentaria', en: 'Sedimentary' },
    category: 'sedimentary',
    color: { es: 'Blanco, gris, rosa', en: 'White, gray, pink' },
    grain: { es: 'Fino a medio', en: 'Fine to medium' },
    emoji: '🏔️',
    description: {
      es: 'Similar a la caliza, pero con composición de carbonato de calcio y magnesio.',
      en: 'Similar to limestone but with calcium magnesium carbonate composition.',
    },
  },
  {
    name: 'Dunite',
    label: { es: 'Dunita', en: 'Dunite' },
    type: { es: 'Ígnea - Ultramáfica', en: 'Igneous - Ultramafic' },
    category: 'igneous',
    color: { es: 'Verde, verde oliva', en: 'Green, olive' },
    grain: { es: 'Grueso', en: 'Coarse' },
    emoji: '🫒',
    description: {
      es: 'Roca ultramáfica compuesta casi solo de olivino, formada en el manto profundo de la Tierra.',
      en: "Ultramafic rock composed mostly of olivine, formed deep in Earth's mantle.",
    },
  },
  {
    name: 'Syenite',
    label: { es: 'Sienita', en: 'Syenite' },
    type: { es: 'Ígnea - Intrusiva', en: 'Igneous - Intrusive' },
    category: 'igneous',
    color: { es: 'Gris, rosa', en: 'Gray, pink' },
    grain: { es: 'Grueso', en: 'Coarse' },
    emoji: '🩷',
    description: {
      es: 'Similar al granito pero con muy poco cuarzo. Compuesta principalmente de feldespato alcalino.',
      en: 'Similar to granite but very low in quartz. Composed mainly of alkali feldspar.',
    },
  },
  {
    name: 'Porphyry',
    label: { es: 'Pórfido', en: 'Porphyry' },
    type: { es: 'Ígnea', en: 'Igneous' },
    category: 'igneous',
    color: { es: 'Variable', en: 'Variable' },
    grain: { es: 'Mixto', en: 'Mixed' },
    emoji: '🎨',
    description: {
      es: 'Cristales grandes embebidos en una matriz de grano fino, señal de dos etapas de enfriamiento.',
      en: 'Large crystals embedded in a fine-grained matrix, indicating two stages of cooling.',
    },
  },
]

/** Canonical class name → catalogue entry. */
export const CATALOG_BY_NAME: Record<string, CatalogEntry> = Object.fromEntries(
  ROCK_CATALOG.map((r) => [r.name, r]),
)

/**
 * Spanish translation of the geology the API returns with a prediction.
 * Field names mirror `RockInfo` so the result card can overlay them directly.
 * English is intentionally absent: it comes from the API response.
 */
export interface RockGeologyEs {
  type: string
  color: string
  grain_size: string
  mineral_composition: string[]
  formation: string[]
  uses: string[]
  description: string
}

export const ROCK_GEOLOGY_ES: Record<string, RockGeologyEs> = {
  Granite: {
    type: 'Ígnea - Intrusiva',
    color: 'Gris claro, blanco, rosa',
    grain_size: 'Grueso (> 5 mm)',
    mineral_composition: ['Cuarzo 30-40 %', 'Feldespato 50-60 %', 'Mica 10-20 %'],
    formation: [
      'Se forma por el enfriamiento lento del magma',
      'Presente en la corteza continental',
      'Común en las raíces de las cordilleras',
    ],
    uses: ['Material de construcción (encimeras, monumentos)', 'Piedra decorativa', 'Árido para concreto'],
    description:
      'El granito es una roca ígnea dura y de color claro, compuesta principalmente por cuarzo, feldespato y micas. Se forma en profundidad por el enfriamiento lento del magma.',
  },
  Basalt: {
    type: 'Ígnea - Extrusiva',
    color: 'Gris oscuro a negro',
    grain_size: 'Fino (< 1 mm)',
    mineral_composition: ['Piroxeno', 'Feldespato', 'Magnetita'],
    formation: [
      'Se forma por el enfriamiento rápido de la lava',
      'Es la roca volcánica más común',
      'Constituye la corteza oceánica',
    ],
    uses: ['Árido para carreteras', 'Piedra decorativa', 'Piedra triturada para construcción'],
    description:
      'El basalto es una roca volcánica oscura y densa, de grano fino. Se forma por el enfriamiento rápido de las coladas de lava en la superficie terrestre.',
  },
  Limestone: {
    type: 'Sedimentaria',
    color: 'Blanco, gris, beige, marrón',
    grain_size: 'Variable',
    mineral_composition: ['Calcita (CaCO3)'],
    formation: [
      'Se forma por acumulación de conchas y organismos',
      'Precipitada a partir del agua de mar',
      'Ambientes marinos',
    ],
    uses: ['Producción de cemento', 'Piedra de construcción', 'Árido', 'Agricultura (enmienda de suelos)'],
    description:
      'La caliza es una roca sedimentaria compuesta principalmente por carbonato de calcio. Se forma por la acumulación de conchas, corales y otros organismos marinos.',
  },
  Sandstone: {
    type: 'Sedimentaria',
    color: 'Beige, marrón, rojo, blanco, gris',
    grain_size: 'Medio (arena de 0,06-2 mm)',
    mineral_composition: ['Cuarzo', 'Feldespato', 'Mica'],
    formation: [
      'Se forma por consolidación de granos de arena',
      'Depositada en ríos, playas y desiertos',
      'Compactada y cementada con el tiempo',
    ],
    uses: ['Piedra de construcción', 'Piedra decorativa', 'Arena para vidrio', 'Material abrasivo'],
    description:
      'La arenisca es una roca sedimentaria clástica formada por granos minerales del tamaño de la arena, ya consolidados. Suele ser beige, roja o marrón y tiene textura granulosa.',
  },
  Shale: {
    type: 'Sedimentaria',
    color: 'Gris, negro, marrón, rojo',
    grain_size: 'Muy fino (< 0,004 mm)',
    mineral_composition: ['Minerales de arcilla', 'Cuarzo', 'Feldespato'],
    formation: [
      'Se forma por compactación de lodo y arcilla',
      'Depositada en ambientes de aguas tranquilas',
      'Es la roca sedimentaria más común',
    ],
    uses: ['Fabricación de ladrillos', 'Producción de cemento', 'Extracción de lutitas bituminosas'],
    description:
      'La lutita es una roca sedimentaria de grano fino formada por lodo compactado. Se parte con facilidad en capas delgadas y es la roca sedimentaria más común.',
  },
  Slate: {
    type: 'Metamórfica',
    color: 'Gris, negro, verde, morado',
    grain_size: 'Muy fino',
    mineral_composition: ['Mica', 'Clorita', 'Cuarzo'],
    formation: [
      'Se forma por metamorfismo de la lutita',
      'Roca metamórfica de bajo grado',
      'Desarrolla clivaje pizarroso',
    ],
    uses: ['Tejas para techos', 'Baldosas', 'Pizarrones', 'Piedra decorativa'],
    description:
      'La pizarra es una roca metamórfica de grano fino derivada de la lutita. Es conocida por su capacidad de partirse en láminas delgadas y planas.',
  },
  Marble: {
    type: 'Metamórfica',
    color: 'Blanco, rosa, gris, verde',
    grain_size: 'Cristalino medio a grueso',
    mineral_composition: ['Calcita', 'Dolomita'],
    formation: [
      'Se forma por metamorfismo de la caliza',
      'Recristalización bajo calor y presión',
      'Desarrolla una textura cristalina entrelazada',
    ],
    uses: ['Material escultórico', 'Fachadas', 'Encimeras', 'Piedra decorativa'],
    description:
      'El mármol es una roca metamórfica formada por recristalización de la caliza. Es apreciado por su belleza y se ha usado en arte y arquitectura durante milenios.',
  },
  Quartzite: {
    type: 'Metamórfica',
    color: 'Blanco, gris, rosa, rojo',
    grain_size: 'Cristalino medio',
    mineral_composition: ['Cuarzo (> 90 %)'],
    formation: [
      'Se forma por metamorfismo de la arenisca',
      'Los granos de cuarzo recristalizan y se sueldan',
      'Muy dura y resistente a la meteorización',
    ],
    uses: ['Piedra decorativa', 'Encimeras', 'Construcción de carreteras', 'Balasto ferroviario'],
    description:
      'La cuarcita es una roca metamórfica dura y no foliada formada a partir de arenisca. Está compuesta casi por completo de cuarzo y es extremadamente duradera.',
  },
  Gneiss: {
    type: 'Metamórfica',
    color: 'Bandeado claro y oscuro',
    grain_size: 'Medio a grueso',
    mineral_composition: ['Feldespato', 'Cuarzo', 'Mica', 'Anfíbol'],
    formation: [
      'Metamorfismo de alto grado de diversas rocas',
      'Desarrolla el bandeado característico',
      'Se forma en profundidad bajo presión extrema',
    ],
    uses: ['Piedra de construcción', 'Encimeras', 'Paisajismo decorativo'],
    description:
      'El gneis es una roca metamórfica de alto grado con un bandeado característico de minerales claros y oscuros. Se forma bajo calor y presión extremos en la corteza profunda.',
  },
  Schist: {
    type: 'Metamórfica',
    color: 'Plateado, verde, marrón',
    grain_size: 'Medio a grueso',
    mineral_composition: ['Mica', 'Clorita', 'Talco', 'Granate'],
    formation: [
      'Metamorfismo de grado medio',
      'Desarrolla una foliación marcada (esquistosidad)',
      'Suele presentar cristales minerales visibles',
    ],
    uses: ['Piedra decorativa', 'Paisajismo', 'Material de construcción histórico'],
    description:
      'El esquisto es una roca metamórfica de grado medio caracterizada por su foliación marcada y sus granos minerales visibles, sobre todo micas que le dan un aspecto brillante.',
  },
  Diorite: {
    type: 'Ígnea - Intrusiva',
    color: 'Gris medio (sal y pimienta)',
    grain_size: 'Grueso',
    mineral_composition: ['Feldespato plagioclasa', 'Hornblenda', 'Biotita'],
    formation: [
      'Se forma por enfriamiento lento de magma intermedio',
      'Cristaliza bajo la superficie',
      'Composición intermedia entre granito y gabro',
    ],
    uses: ['Piedra de construcción', 'Piedra decorativa', 'Árido'],
    description:
      'La diorita es una roca ígnea intrusiva de composición intermedia, lo que le da su aspecto característico de "sal y pimienta".',
  },
  Pegmatite: {
    type: 'Ígnea - Intrusiva',
    color: 'Variable (predominan los tonos claros)',
    grain_size: 'Muy grueso (> 2,5 cm)',
    mineral_composition: ['Cuarzo', 'Feldespato', 'Mica', 'Minerales raros'],
    formation: [
      'Se forma en las últimas etapas de cristalización del magma',
      'Cristales muy grandes por la abundancia de fluidos volátiles',
      'A menudo contiene minerales de tierras raras',
    ],
    uses: ['Fuente de minerales raros', 'Minería de gemas', 'Minerales industriales'],
    description:
      'La pegmatita es una roca ígnea intrusiva con cristales excepcionalmente grandes, formada en las etapas finales del enfriamiento del magma, cuando los fluidos ricos en volátiles favorecen el crecimiento cristalino.',
  },
  Obsidian: {
    type: 'Ígnea - Extrusiva (vidrio volcánico)',
    color: 'Negro, marrón oscuro, caoba',
    grain_size: 'Vítreo (sin cristales)',
    mineral_composition: ['Vidrio volcánico (rico en SiO2)'],
    formation: [
      'Se forma por enfriamiento extremadamente rápido de la lava',
      'El alto contenido de sílice impide la cristalización',
      'Se encuentra cerca de centros volcánicos',
    ],
    uses: ['Bisturís quirúrgicos', 'Joyería', 'Herramientas y armas históricas'],
    description:
      'La obsidiana es un vidrio volcánico natural que se forma cuando la lava se enfría tan rápido que no alcanzan a formarse cristales. Tiene brillo vítreo y fractura concoidea.',
  },
  Pumice: {
    type: 'Ígnea - Extrusiva (volcánica)',
    color: 'Blanco, gris claro, crema',
    grain_size: 'Vesicular (porosa)',
    mineral_composition: ['Vidrio volcánico con burbujas de gas'],
    formation: [
      'Se forma en erupciones explosivas ricas en gas',
      'El gas atrapado genera la textura porosa',
      'Puede flotar en el agua por su baja densidad',
    ],
    uses: ['Productos abrasivos', 'Concreto ligero', 'Horticultura', 'Cosmética'],
    description:
      'La pómez es una roca volcánica extremadamente porosa que se forma durante erupciones explosivas. Sus numerosas burbujas de gas atrapadas la hacen tan ligera que flota en el agua.',
  },
  Andesite: {
    type: 'Ígnea - Extrusiva',
    color: 'Gris, gris oscuro',
    grain_size: 'Fino a medio',
    mineral_composition: ['Plagioclasa', 'Piroxeno', 'Hornblenda'],
    formation: [
      'Se forma en erupciones volcánicas de composición intermedia',
      'Común en volcanes de zonas de subducción',
      'Debe su nombre a la cordillera de los Andes',
    ],
    uses: ['Piedra de construcción', 'Árido para carreteras', 'Piedra decorativa'],
    description:
      'La andesita es una roca volcánica de composición intermedia, común en los volcanes de zonas de subducción. Debe su nombre a la cordillera de los Andes, donde abunda.',
  },
  Rhyolite: {
    type: 'Ígnea - Extrusiva',
    color: 'Gris claro, rosa, beige',
    grain_size: 'Fino (a menudo con fenocristales)',
    mineral_composition: ['Cuarzo', 'Feldespato', 'Biotita'],
    formation: [
      'Se forma en erupciones volcánicas ricas en sílice',
      'Equivalente extrusivo del granito',
      'A menudo asociada a erupciones explosivas',
    ],
    uses: ['Piedra decorativa', 'Árido', 'Fabricación histórica de herramientas'],
    description:
      'La riolita es una roca volcánica de color claro y grano fino, equivalente extrusivo del granito. Se forma a partir de lavas muy viscosas y ricas en sílice.',
  },
  Conglomerate: {
    type: 'Sedimentaria',
    color: 'Variable (guijarros multicolores)',
    grain_size: 'Grueso (guijarros redondeados > 2 mm)',
    mineral_composition: ['Fragmentos de roca diversos', 'Cuarzo', 'Feldespato'],
    formation: [
      'Se forma a partir de grava y guijarros redondeados',
      'Depositado por ríos y corrientes',
      'Cementado por minerales con el tiempo',
    ],
    uses: ['Piedra decorativa', 'Árido', 'Estudio geológico'],
    description:
      'El conglomerado es una roca sedimentaria de grano grueso compuesta por guijarros y grava redondeados cementados entre sí. El redondeamiento de sus fragmentos indica transporte por agua.',
  },
  Breccia: {
    type: 'Sedimentaria',
    color: 'Variable',
    grain_size: 'Grueso (fragmentos angulosos > 2 mm)',
    mineral_composition: ['Fragmentos angulosos de roca diversos'],
    formation: [
      'Se forma a partir de fragmentos angulosos de roca',
      'Transporte mínimo (los fragmentos siguen angulosos)',
      'Puede originarse en deslizamientos, fallas o actividad volcánica',
    ],
    uses: ['Piedra decorativa', 'Estudio geológico', 'Material de construcción'],
    description:
      'La brecha es una roca sedimentaria de grano grueso compuesta por fragmentos angulosos de roca. A diferencia del conglomerado, sus bordes afilados indican poco o ningún transporte por agua.',
  },
  Tuff: {
    type: 'Ígnea - Piroclástica',
    color: 'Blanco, beige, marrón, verde',
    grain_size: 'Fino a medio (tamaño ceniza)',
    mineral_composition: ['Ceniza volcánica', 'Fragmentos de vidrio', 'Fragmentos de cristales'],
    formation: [
      'Se forma por compactación de ceniza volcánica',
      'Depositada durante erupciones explosivas',
      'Detritos volcánicos litificados',
    ],
    uses: ['Piedra de construcción', 'Construcción ligera', 'Arquitectura histórica'],
    description:
      'La toba es una roca formada por ceniza volcánica compactada, expulsada durante erupciones explosivas. Es relativamente blanda y se ha usado como piedra de construcción a lo largo de la historia.',
  },
  Flint: {
    type: 'Sedimentaria',
    color: 'Negro, gris oscuro, marrón',
    grain_size: 'Criptocristalino (muy fino)',
    mineral_composition: ['Calcedonia (cuarzo microcristalino)'],
    formation: [
      'Se forma a partir de soluciones ricas en sílice en calizas',
      'Aparece como nódulos en creta y caliza',
      'Sílice biogénica de organismos marinos',
    ],
    uses: ['Fabricación histórica de herramientas', 'Encendido de fuego', 'Material de construcción'],
    description:
      'El sílex es una variedad sedimentaria dura y criptocristalina del cuarzo. Fue uno de los primeros materiales que la humanidad usó para fabricar herramientas, gracias a su fractura concoidea.',
  },
  Chalk: {
    type: 'Sedimentaria',
    color: 'Blanco, blanco hueso',
    grain_size: 'Muy fino (microscópico)',
    mineral_composition: ['Calcita (de cocolitofóridos)'],
    formation: [
      'Se forma a partir de organismos marinos microscópicos',
      'Acumulada en fondos oceánicos profundos',
      'Compuesta por conchas de cocolitofóridos',
    ],
    uses: ['Tiza para escribir', 'Producción de cemento', 'Agricultura', 'Cosmética'],
    description:
      'La creta es una roca sedimentaria blanda, blanca y porosa, compuesta por las conchas microscópicas de unos organismos marinos llamados cocolitofóridos.',
  },
  Dolomite: {
    type: 'Sedimentaria',
    color: 'Blanco, gris, rosa, beige',
    grain_size: 'Cristalino fino a medio',
    mineral_composition: ['Mineral dolomita CaMg(CO3)2'],
    formation: [
      'Se forma por alteración de la caliza',
      'Fluidos ricos en magnesio sustituyen al calcio',
      'Proceso conocido como dolomitización',
    ],
    uses: ['Árido para construcción', 'Producción de cemento', 'Material refractario', 'Acondicionador de suelos'],
    description:
      'La dolomía es una roca sedimentaria similar a la caliza, pero compuesta por el mineral dolomita (carbonato de calcio y magnesio) en lugar de calcita pura.',
  },
  Dunite: {
    type: 'Ígnea - Intrusiva (ultramáfica)',
    color: 'Verde, verde oliva, amarillento',
    grain_size: 'Grueso',
    mineral_composition: ['Olivino (> 90 %)', 'Cromita', 'Piroxeno'],
    formation: [
      'Se forma en el manto profundo de la Tierra',
      'Roca ultramáfica rica en olivino',
      'Presente en complejos ofiolíticos',
    ],
    uses: ['Fuente de olivino', 'Material refractario', 'Investigación en secuestro de CO2'],
    description:
      'La dunita es una roca plutónica ultramáfica compuesta casi por completo de olivino. Se forma en el manto profundo y llega a la superficie mediante procesos tectónicos.',
  },
  Syenite: {
    type: 'Ígnea - Intrusiva',
    color: 'Gris, rosa, blanco',
    grain_size: 'Grueso',
    mineral_composition: ['Feldespato alcalino', 'Hornblenda', 'Biotita'],
    formation: [
      'Se forma por enfriamiento lento de magma alcalino',
      'Similar al granito pero con menos cuarzo',
      'Presente en zonas de rift continental',
    ],
    uses: ['Piedra de construcción', 'Piedra decorativa', 'Piedra dimensionada'],
    description:
      'La sienita es una roca ígnea intrusiva de grano grueso, similar al granito pero con muy poco cuarzo. Está compuesta principalmente por feldespato alcalino.',
  },
  Porphyry: {
    type: 'Ígnea',
    color: 'Variable (según la composición)',
    grain_size: 'Mixto (cristales grandes en matriz fina)',
    mineral_composition: ['Fenocristales de feldespato', 'Cuarzo', 'Minerales diversos de la matriz'],
    formation: [
      'Enfriamiento del magma en dos etapas',
      'Los cristales grandes se forman lentamente en profundidad',
      'La matriz fina se forma por enfriamiento rápido en superficie',
    ],
    uses: ['Piedra decorativa', 'Material de construcción', 'Roca huésped de menas de cobre'],
    description:
      'El pórfido es un término textural para rocas ígneas con cristales grandes (fenocristales) embebidos en una matriz de grano fino, lo que indica dos etapas de enfriamiento.',
  },
}

/** Display name for a class id, falling back to the raw id for unknown classes. */
export function rockLabel(className: string, locale: 'es' | 'en'): string {
  return CATALOG_BY_NAME[className]?.label[locale] ?? className
}
