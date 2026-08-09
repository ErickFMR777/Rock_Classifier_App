/**
 * All user-facing UI copy, in both locales.
 *
 * Typed as `Localized<…>`, so `tsc` rejects any entry missing a language and
 * the Vercel build (`tsc && vite build`) fails rather than shipping a
 * half-translated page. Rock content lives separately in `data/rocks.ts`.
 *
 * Entries that need a value interpolated are `Localized<(x) => string>` rather
 * than a template with a placeholder token: the argument order and the
 * grammar around it differ per language, and a function keeps that decision
 * inside the translation instead of at the call site.
 */

import type { Localized, Locale } from '../lib/i18n'
import type { RockCategory } from './rocks'

export const ui = {
  brand: 'RockClassifier',
  brandSuffix: '.ai',

  localeToggle: {
    label: { es: 'Cambiar idioma', en: 'Change language' } satisfies Localized<string>,
  },

  nav: {
    classifier: { es: 'Clasificar', en: 'Classify' } satisfies Localized<string>,
    catalog: { es: 'Catálogo', en: 'Rock Catalog' } satisfies Localized<string>,
    about: { es: 'Acerca de', en: 'About' } satisfies Localized<string>,
    apiChecking: { es: 'Comprobando…', en: 'Checking…' } satisfies Localized<string>,
    apiOnline: { es: 'IA en línea', en: 'AI Online' } satisfies Localized<string>,
    apiOffline: { es: 'IA fuera de línea', en: 'AI Offline' } satisfies Localized<string>,
  },

  /* ---- Classifier page ------------------------------------------------- */
  classifier: {
    title: { es: 'Identificador de rocas', en: 'Rock Identifier' } satisfies Localized<string>,
    /** Split so "25 rock types" can stay emphasised without embedding markup. */
    subtitleBefore: {
      es: 'Sube una foto y nuestra IA la clasificará entre nuestro catálogo de ',
      en: 'Upload a photo and our AI will classify it among our catalog of ',
    } satisfies Localized<string>,
    subtitleHighlight: {
      es: '25 tipos de roca',
      en: '25 rock types',
    } satisfies Localized<string>,
    subtitleAfter: {
      es: ' en segundos.',
      en: ' in seconds.',
    } satisfies Localized<string>,

    classify: { es: 'Clasificar roca', en: 'Classify Rock' } satisfies Localized<string>,
    classifying: { es: 'Clasificando…', en: 'Classifying...' } satisfies Localized<string>,

    statTypes: { es: 'Tipos de roca', en: 'Rock Types' } satisfies Localized<string>,
    statResponse: { es: 'Respuesta', en: 'Response' } satisfies Localized<string>,
    statMatches: { es: 'Coincidencias', en: 'Matches' } satisfies Localized<string>,

    errorTitle: { es: 'Error de clasificación', en: 'Classification Error' } satisfies Localized<string>,
    errorGeneric: { es: 'Falló la clasificación.', en: 'Classification failed.' } satisfies Localized<string>,

    /**
     * Accuracy caveat shown next to every result. It was already in the app —
     * in Spanish only, on an otherwise English page. Now it exists in both.
     */
    accuracyNotice: {
      es: 'La precisión del modelo depende de la cantidad de datos disponibles para cada tipo de roca. Algunas clases tienen menos imágenes de entrenamiento, lo que puede reducir la exactitud de la predicción. Aumentar la cantidad de imágenes por clase mejorará el rendimiento del modelo con el tiempo.',
      en: 'Model accuracy depends on how much data is available for each rock type. Some classes have fewer training images, which can reduce how accurate the prediction is. Increasing the number of images per class will improve the model over time.',
    } satisfies Localized<string>,

    readyTitle: { es: 'Listo para clasificar', en: 'Ready to Classify' } satisfies Localized<string>,
    readyBody: {
      es: 'Sube la foto de una roca para empezar. Recibirás una clasificación detallada con información geológica.',
      en: "Upload a rock photo to get started. You'll receive a detailed classification with geological information.",
    } satisfies Localized<string>,
    readyBullets: {
      es: [
        'Clasificación con porcentaje de confianza',
        'Tipo geológico e información de formación',
        'Detalle de composición mineral',
        'Las 5 coincidencias más probables',
      ],
      en: [
        'Classification with confidence percentage',
        'Geological type and formation info',
        'Mineral composition details',
        'Top 5 alternative matches',
      ],
    } satisfies Localized<string[]>,

    footerLeft: {
      es: 'RockClassifier.ai — Impulsado por ResNet18 + ONNX Runtime',
      en: 'RockClassifier.ai — Powered by ResNet18 + ONNX Runtime',
    } satisfies Localized<string>,
    footerRight: {
      es: 'React + funciones de Vercel + aprendizaje profundo',
      en: 'React + Vercel Functions + Deep Learning',
    } satisfies Localized<string>,
  },

  /* ---- Upload zone ------------------------------------------------------ */
  upload: {
    previewAlt: { es: 'Vista previa', en: 'Preview' } satisfies Localized<string>,
    changePhoto: { es: 'Cambiar foto', en: 'Change photo' } satisfies Localized<string>,
    dropActive: { es: 'Suelta la imagen aquí', en: 'Drop your image here' } satisfies Localized<string>,
    dropIdle: {
      es: 'Arrastra la foto de una roca o haz clic para buscarla',
      en: 'Drop a rock photo or click to browse',
    } satisfies Localized<string>,
    formats: { es: 'JPG, PNG, WebP — hasta 5 MB', en: 'JPG, PNG, WebP — up to 5 MB' } satisfies Localized<string>,
  },

  /* ---- Loading ---------------------------------------------------------- */
  loading: {
    title: { es: 'Analizando tu roca…', en: 'Analyzing your rock...' } satisfies Localized<string>,
    subtitle: {
      es: 'Usando IA de aprendizaje profundo (ResNet18)',
      en: 'Using deep learning AI (ResNet18)',
    } satisfies Localized<string>,
  },

  /* ---- Result card ------------------------------------------------------ */
  result: {
    identifiedAs: { es: 'Identificada como', en: 'Identified As' } satisfies Localized<string>,
    confidenceHigh: { es: 'Confianza alta', en: 'High confidence' } satisfies Localized<string>,
    confidenceModerate: { es: 'Confianza media', en: 'Moderate confidence' } satisfies Localized<string>,
    confidenceLow: { es: 'Confianza baja', en: 'Low confidence' } satisfies Localized<string>,
    color: { es: 'Color', en: 'Color' } satisfies Localized<string>,
    grainSize: { es: 'Tamaño de grano', en: 'Grain Size' } satisfies Localized<string>,
    minerals: { es: 'Minerales', en: 'Minerals' } satisfies Localized<string>,
    formation: { es: 'Formación', en: 'Formation' } satisfies Localized<string>,
    uses: { es: 'Usos comunes', en: 'Common Uses' } satisfies Localized<string>,
    alternatives: { es: 'Otras coincidencias', en: 'Alternative Matches' } satisfies Localized<string>,
    topPredictions: { es: 'Predicciones top-5', en: 'Top-5 predictions' } satisfies Localized<string>,
  },

  /* ---- Catalogue -------------------------------------------------------- */
  catalog: {
    title: { es: 'Catálogo de rocas', en: 'Rock Catalog' } satisfies Localized<string>,
    subtitleBefore: { es: 'Explora los ', en: 'Explore the ' } satisfies Localized<string>,
    subtitleHighlight: { es: '25 tipos de roca', en: '25 rock types' } satisfies Localized<string>,
    subtitleAfter: {
      es: ' que nuestra IA puede identificar. Conoce sus propiedades, formación y usos.',
      en: ' our AI can identify. Learn about their properties, formation, and uses.',
    } satisfies Localized<string>,
    searchPlaceholder: {
      es: 'Busca rocas por nombre o tipo…',
      en: 'Search rocks by name or type...',
    } satisfies Localized<string>,
    color: { es: 'Color', en: 'Color' } satisfies Localized<string>,
    grainSize: { es: 'Tamaño de grano', en: 'Grain Size' } satisfies Localized<string>,
    category: { es: 'Categoría', en: 'Category' } satisfies Localized<string>,
    empty: { es: 'Ninguna roca coincide con tu búsqueda.', en: 'No rocks match your search.' } satisfies Localized<string>,
  },

  /** Shared by the catalogue filters, the metrics filters and the card badges. */
  categories: {
    all: { es: 'Todas', en: 'All' } satisfies Localized<string>,
    igneous: { es: 'Ígneas', en: 'Igneous' } satisfies Localized<string>,
    sedimentary: { es: 'Sedimentarias', en: 'Sedimentary' } satisfies Localized<string>,
    metamorphic: { es: 'Metamórficas', en: 'Metamorphic' } satisfies Localized<string>,
  },

  /* ---- About page ------------------------------------------------------- */
  about: {
    titleBefore: { es: 'Acerca de RockClassifier', en: 'About RockClassifier' } satisfies Localized<string>,
    intro: {
      es: 'Una herramienta con IA que identifica rocas a partir de fotografías usando aprendizaje profundo. Pensada para estudiantes de geología, investigadores de campo, coleccionistas y cualquier persona con curiosidad por el suelo que pisa.',
      en: 'An AI-powered tool that identifies rocks from photographs using deep learning. Built for geology students, field researchers, rock collectors, and anyone curious about the earth beneath their feet.',
    } satisfies Localized<string>,

    howItWorks: { es: 'Cómo funciona', en: 'How It Works' } satisfies Localized<string>,
    steps: {
      es: [
        { title: 'Subir', description: 'Arrastra o haz clic para subir la foto de una roca (JPG, PNG o WebP, hasta 5 MB).' },
        { title: 'Procesar', description: 'La imagen se reescala a 256 px por el lado corto, se recorta al centro a 224×224 y se normaliza con las estadísticas de ImageNet.' },
        { title: 'Clasificar', description: 'ResNet18 extrae características y predice la probabilidad de cada uno de los 25 tipos de roca.' },
        { title: 'Resultados', description: 'Recibes la mejor coincidencia con su nivel de confianza, información geológica y 4 alternativas.' },
      ],
      en: [
        { title: 'Upload', description: 'Drag and drop or click to upload a rock photo (JPG, PNG, WebP up to 5 MB).' },
        { title: 'Process', description: 'The image is resized so its short side is 256 px, centre-cropped to 224×224 and normalized using ImageNet statistics.' },
        { title: 'Classify', description: 'ResNet18 extracts features and predicts probabilities for each of the 25 rock types.' },
        { title: 'Results', description: 'You receive the top match with confidence score, geological info, and 4 alternative matches.' },
      ],
    } satisfies Localized<{ title: string; description: string }[]>,

    specsTitle: { es: 'Especificaciones del modelo', en: 'Model Specifications' } satisfies Localized<string>,
    specs: {
      es: [
        { label: 'Arquitectura', value: 'ResNet18', detail: 'Red residual profunda de 18 capas' },
        { label: 'Preentrenado en', value: 'ImageNet', detail: '1,2 M de imágenes, 1000 clases' },
        { label: 'Enfoque', value: 'Aprendizaje por transferencia', detail: 'Ajuste fino de las capas 3 y 4 + cabeza FC' },
        { label: 'Tamaño de entrada', value: '224 × 224 px', detail: 'Redimensionado a 256 + recorte central de 224' },
        { label: 'Clases de salida', value: '25 tipos de roca', detail: 'Ígneas, sedimentarias y metamórficas' },
        { label: 'Inferencia', value: '< 200 ms', detail: 'ONNX Runtime en CPU (no requiere GPU)' },
      ],
      en: [
        { label: 'Architecture', value: 'ResNet18', detail: '18-layer deep residual network' },
        { label: 'Pre-trained On', value: 'ImageNet', detail: '1.2M images, 1000 classes' },
        { label: 'Approach', value: 'Transfer Learning', detail: 'Fine-tuned layers 3, 4 + FC head' },
        { label: 'Input Size', value: '224 × 224 px', detail: 'Resize to 256 + 224 centre crop' },
        { label: 'Output Classes', value: '25 Rock Types', detail: 'Igneous, sedimentary, metamorphic' },
        { label: 'Inference', value: '< 200 ms', detail: 'ONNX Runtime on CPU (no GPU required)' },
      ],
    } satisfies Localized<{ label: string; value: string; detail: string }[]>,

    trainingTitle: { es: 'Configuración de entrenamiento', en: 'Training Configuration' } satisfies Localized<string>,
    training: {
      es: [
        { label: 'Conjunto de datos', value: '1481 imágenes', detail: '23-70 por clase, de Wikimedia Commons' },
        { label: 'Épocas', value: '30', detail: 'Cosine annealing con reinicios cálidos (T₀=10)' },
        { label: 'Tamaño de lote', value: '32', detail: 'Con sobremuestreo 3× por época' },
        { label: 'Optimizador', value: 'AdamW', detail: 'Tasas diferenciadas: backbone 2e-4, FC 2e-3' },
        { label: 'Regularización', value: 'Multiestrategia', detail: 'Dropout 0,4, label smoothing 0,1, mixup' },
        { label: 'Tiempo de entrenamiento', value: '~156 min', detail: 'Solo CPU (sin GPU)' },
      ],
      en: [
        { label: 'Dataset', value: '1481 images', detail: '23-70 per class, from Wikimedia Commons' },
        { label: 'Epochs', value: '30', detail: 'Cosine annealing w/ warm restarts (T₀=10)' },
        { label: 'Batch Size', value: '32', detail: 'With 3× oversampling per epoch' },
        { label: 'Optimizer', value: 'AdamW', detail: 'Differential LRs: backbone 2e-4, FC 2e-3' },
        { label: 'Regularization', value: 'Multi-strategy', detail: 'Dropout 0.4, Label Smooth 0.1, Mixup' },
        { label: 'Train Time', value: '~156 min', detail: 'CPU-only (no GPU)' },
      ],
    } satisfies Localized<{ label: string; value: string; detail: string }[]>,

    techniquesLabel: { es: 'Técnicas empleadas:', en: 'Techniques used:' } satisfies Localized<string>,
    techniquesBody: {
      es: ' aprendizaje por transferencia (ImageNet → rocas), aumento de datos mixup (α=0,2), label smoothing (0,1), muestreo aleatorio ponderado para equilibrar clases, cosine annealing con reinicios cálidos (T₀=10), recorte de gradiente (1,0) y aumentos geométricos y de color intensos (rotación, afín, jitter de color, desenfoque gaussiano, borrado aleatorio).',
      en: ' Transfer Learning (ImageNet → Rocks), Mixup Data Augmentation (α=0.2), Label Smoothing (0.1), Weighted Random Sampling for class balance, Cosine Annealing with Warm Restarts (T₀=10), Gradient Clipping (1.0), heavy geometric + color augmentations (rotation, affine, color jitter, Gaussian blur, random erasing).',
    } satisfies Localized<string>,

    performanceTitle: { es: 'Rendimiento del modelo', en: 'Model Performance' } satisfies Localized<string>,
    metricsLive: {
      es: 'Métricas en vivo del modelo desplegado',
      en: 'Live metrics from the deployed model',
    } satisfies Localized<string>,
    metricsBundled: {
      es: 'Métricas de referencia incluidas en la compilación',
      en: 'Reference metrics bundled at build time',
    } satisfies Localized<string>,
    trainedOn: {
      es: (when: string) => `Entrenado el ${when}`,
      en: (when: string) => `Trained ${when}`,
    } satisfies Localized<(when: string) => string>,
    epochsRun: {
      es: (n: number) => `${n} épocas`,
      en: (n: number) => `${n} epochs`,
    } satisfies Localized<(n: number) => string>,
    valSamples: {
      es: (n: number) => `Validación reservada: ${n} imágenes`,
      en: (n: number) => `Held-out validation: ${n} images`,
    } satisfies Localized<(n: number) => string>,

    overallAccuracy: { es: 'Exactitud global', en: 'Overall Accuracy' } satisfies Localized<string>,
    macroPrecision: { es: 'Precisión macro', en: 'Macro Precision' } satisfies Localized<string>,
    macroRecall: { es: 'Exhaustividad macro', en: 'Macro Recall' } satisfies Localized<string>,
    macroF1: { es: 'F1 macro', en: 'Macro F1-Score' } satisfies Localized<string>,

    topkTitle: { es: 'Exactitud top-k', en: 'Top-k Accuracy' } satisfies Localized<string>,
    topkBody: {
      es: 'Con qué frecuencia la roca correcta aparece entre las k mejores predicciones del modelo. La pantalla de resultados muestra cinco, así que top-5 es lo que el usuario puede aprovechar de verdad; top-1 es la lectura más estricta.',
      en: "How often the correct rock appears among the model's top k guesses. The result screen lists five, so top-5 is what a user can actually act on — top-1 is the strictest read.",
    } satisfies Localized<string>,
    topkNotes: {
      es: { top1: 'primer intento correcto', top3: 'dentro de los tres primeros', top5: 'los que se muestran' },
      en: { top1: 'first guess correct', top3: 'within first three', top5: 'shown on screen' },
    } satisfies Localized<Record<'top1' | 'top3' | 'top5', string>>,

    macroWeightedTitle: {
      es: 'Promedios macro y ponderado',
      en: 'Macro vs. Weighted Averages',
    } satisfies Localized<string>,
    /** `**…**` marks emphasis; rendered by `<RichText>`. */
    macroWeightedBody: {
      es: 'El promedio **macro** trata todas las clases por igual, así que las clases con pocos datos lo arrastran hacia abajo. El **ponderado** pesa cada clase por su número de imágenes de validación, así que refleja mejor la mezcla que encontrará un usuario. Una brecha amplia entre ambos es precisamente el desbalance de clases hecho número: citar solo el más alto favorecería al modelo injustamente.',
      en: '**Macro** averages every class equally, so the thin classes drag it down. **Weighted** averages by how many validation images each class has, so it reflects the mix a user is likely to meet. A wide gap between the two is the class imbalance showing up in the numbers — quoting only the higher one would flatter the model.',
    } satisfies Localized<string>,
    tableMetric: { es: 'Métrica', en: 'Metric' } satisfies Localized<string>,
    tableMacro: { es: 'Macro', en: 'Macro' } satisfies Localized<string>,
    tableWeighted: { es: 'Ponderado', en: 'Weighted' } satisfies Localized<string>,
    tableGap: { es: 'Brecha', en: 'Gap' } satisfies Localized<string>,
    precision: { es: 'Precisión', en: 'Precision' } satisfies Localized<string>,
    recall: { es: 'Exhaustividad', en: 'Recall' } satisfies Localized<string>,
    f1: { es: 'F1', en: 'F1-Score' } satisfies Localized<string>,

    perClassTitle: { es: 'Métricas por clase', en: 'Per-Class Metrics' } satisfies Localized<string>,
    sortAZ: { es: 'A-Z', en: 'A-Z' } satisfies Localized<string>,
    colRockType: { es: 'Tipo de roca', en: 'Rock Type' } satisfies Localized<string>,
    macroAverage: { es: 'Promedio macro', en: 'Macro Average' } satisfies Localized<string>,
    categoryAverage: {
      es: (cat: string) => `Promedio ${cat.toLowerCase()}`,
      en: (cat: string) => `${cat} Avg`,
    } satisfies Localized<(cat: string) => string>,

    bestTitle: { es: 'Rocas mejor clasificadas', en: 'Best Performing Rocks' } satisfies Localized<string>,
    worstTitle: { es: 'Rocas más difíciles', en: 'Most Challenging Rocks' } satisfies Localized<string>,
    worstNote: {
      es: 'Las puntuaciones bajas se deben sobre todo al conjunto de datos pequeño (~30 imágenes por clase) y al parecido visual entre ciertos tipos de roca.',
      en: 'Low scores are mainly due to the small dataset (~30 images per class) and visual similarity between certain rock types.',
    } satisfies Localized<string>,

    datasetTitle: { es: 'Datos y equilibrio de clases', en: 'Dataset & Class Balance' } satisfies Localized<string>,
    datasetSourceBody: {
      es: 'Las imágenes de entrenamiento provienen de Wikimedia Commons, que rehospeda fotografía de especímenes de fuentes reconocidas —en particular GeoDIL (Geoscience Digital Image Library), cuyas muestras de mano están fotografiadas sobre fondos neutros—. La licencia y el autor de cada imagen quedan registrados en el manifiesto del conjunto de datos.',
      en: "Training images come from Wikimedia Commons, which re-hosts specimen photography from recognised sources — notably GeoDIL (Geoscience Digital Image Library), whose hand samples are shot against neutral backgrounds. Every image's licence and author is recorded in the dataset manifest.",
    } satisfies Localized<string>,
    datasetWarnLead: {
      es: 'Este es un conjunto de datos pequeño y desbalanceado, y ese es el principal límite de la exactitud.',
      en: 'This is a small, imbalanced dataset, and that is the main limit on accuracy.',
    } satisfies Localized<string>,
    datasetWarnBody: {
      es: ' Sencillamente no existe la misma cantidad de fotografía de especímenes con licencia abierta para todos los tipos de roca. Rocas comunes como el granito, el basalto y la caliza tienen de sobra; las raras como la dunita y la sienita tienen muy pocas. Las clases con menos imágenes son medibles como menos fiables, y ninguna cantidad de aumento de datos lo compensa del todo.',
      en: ' Openly-licensed specimen photography simply does not exist in equal amounts for every rock type. Common rocks like Granite, Basalt and Limestone have plenty; rare ones like Dunite and Syenite have very few. Classes with fewer images are measurably less reliable, and no amount of augmentation fully compensates for that.',
    } satisfies Localized<string>,
    imagesPerClass: { es: 'Imágenes por clase', en: 'Images per class' } satisfies Localized<string>,
    imagesTotal: {
      es: (n: number) => `${n} imágenes en total`,
      en: (n: number) => `${n} images total`,
    } satisfies Localized<(n: number) => string>,
    legendUnreliable: { es: 'menos de 25 — no fiable', en: 'under 25 — unreliable' } satisfies Localized<string>,
    legendWeak: { es: '25-39 — débil', en: '25–39 — weak' } satisfies Localized<string>,
    legendAcceptable: { es: '40+ — aceptable', en: '40+ — acceptable' } satisfies Localized<string>,
    thinLead: {
      es: 'Poco representadas en esta versión:',
      en: 'Under-represented in this build:',
    } satisfies Localized<string>,
    thinBody: {
      es: '. Las predicciones que nombren estos tipos merecen un escepticismo extra, y el modelo además está sesgado en su contra: recurrirá más a menudo a una clase bien representada que ha visto más veces.',
      en: '. Predictions naming these types deserve extra scepticism, and the model is also biased against them — it will more often fall back on a well-represented class it has seen more of.',
    } satisfies Localized<string>,
    datasetFallback: {
      es: 'Las estadísticas del conjunto de datos se cargan desde el backend. Conecta la API de clasificación para ver el conteo exacto de imágenes por clase del modelo desplegado.',
      en: 'Live dataset statistics load from the backend. Connect the classification API to see the exact per-class image counts for the deployed model.',
    } satisfies Localized<string>,

    confusionTitle: { es: 'Matriz de confusión', en: 'Confusion Matrix' } satisfies Localized<string>,
    confusionBody: {
      es: 'Cada fila es el tipo de roca real y cada columna lo que el modelo predijo, sobre la partición de validación reservada. Un modelo perfecto solo iluminaría la diagonal. Las celdas fuera de ella son las confusiones reales; la mayoría ocurre entre rocas genuinamente parecidas (gneis/esquisto, creta/caliza), que es el modo de fallo esperable y no un error.',
      en: 'Each row is the true rock type and each column what the model predicted, on the held-out validation split. A perfect model would light up only the diagonal. Off-diagonal cells are the real confusions — most of them fall between genuinely similar rocks (Gneiss/Schist, Chalk/Limestone), which is the expected failure mode rather than a bug.',
    } satisfies Localized<string>,
    confusionCaveat: {
      es: 'Las filas de las clases con pocos datos se basan en muy pocas muestras de validación, así que un solo error mueve su puntuación drásticamente. Léelas como indicativas, no como estadística.',
      en: 'Rows for thin classes are based on very few validation samples, so a single mistake swings their score dramatically. Read those rows as indicative, not statistical.',
    } satisfies Localized<string>,
    confusionCell: {
      es: (truth: string, pred: string, n: number) => `${truth} real → predicho ${pred}: ${n}`,
      en: (truth: string, pred: string, n: number) => `True ${truth} → predicted ${pred}: ${n}`,
    } satisfies Localized<(truth: string, pred: string, n: number) => string>,
    confusionLegendCorrect: { es: 'correcto (diagonal)', en: 'correct (diagonal)' } satisfies Localized<string>,
    confusionLegendWrong: { es: 'mal clasificado', en: 'misclassified' } satisfies Localized<string>,

    limitationsTitle: { es: 'Limitaciones', en: 'Limitations' } satisfies Localized<string>,
    limitations: {
      es: [
        { label: 'Conjunto de datos pequeño:', body: 'unas pocas decenas de imágenes por clase, no los miles que necesita un clasificador robusto. Es la mayor restricción sobre la exactitud, por encima de la arquitectura o la receta de entrenamiento.' },
        { label: 'Cobertura desigual de clases:', body: 'algunos tipos de roca no pudieron representarse bien. La fotografía de especímenes con licencia abierta abunda para las rocas comunes y escasea para las raras, así que clases como la dunita o la sienita se construyeron con un puñado de imágenes. Sus puntuaciones en la tabla anterior no son fiables en ninguna dirección.' },
        { label: 'Sesgo hacia las clases bien representadas:', body: 'ante la duda, el modelo se inclina por los tipos que más vio. El muestreo ponderado reduce esto pero no lo elimina: un "granito" confiado sobre una foto ambigua puede ser solo el sesgo hablando.' },
        { label: 'Partición de validación pequeña:', body: 'las métricas y la matriz de confusión se calculan sobre un 20 % reservado. Para las clases con pocos datos eso son un par de imágenes, así que un error mueve el número decenas de puntos porcentuales. Toma las cifras por clase como indicativas, no como precisas.' },
        { label: 'Parecido visual:', body: 'gneis frente a esquisto y creta frente a caliza comparten rasgos visuales. Estas confusiones se ven en la matriz de arriba y son genuinamente difíciles: los geólogos usan dureza, reacción al ácido y estructura del grano, y nada de eso lo captura una foto.' },
        { label: 'Escala fotográfica mixta:', body: 'la mayoría de las imágenes de entrenamiento son muestras de mano sobre fondo neutro, pero aproximadamente una de cada seis es una foto de campo o de afloramiento que pasó el filtrado. El modelo ve la misma roca a escalas muy distintas, lo que difumina lo que aprende. Los primeros planos de un solo espécimen son lo que mejor maneja.' },
        { label: 'Limitado a 25 tipos:', body: 'no existe la opción "desconocido". Las rocas fuera de este catálogo se fuerzan a la coincidencia más cercana y se reportan igual con un nivel de confianza.' },
        { label: 'Herramienta de demostración:', body: 'no sirve para evaluación geológica profesional; verifica siempre con un especialista.' },
        { label: 'Depende de la calidad de la imagen:', body: 'las fotos borrosas, oscuras o lejanas producen resultados poco fiables.' },
      ],
      en: [
        { label: 'Small dataset:', body: 'A few dozen images per class, not the thousands a robust classifier needs. This is the single biggest constraint on accuracy — bigger than the architecture or the training recipe.' },
        { label: 'Unequal class coverage:', body: 'Some rock types could not be represented well. Openly-licensed specimen photography is abundant for common rocks and scarce for rare ones, so classes like Dunite or Syenite are built from a handful of images. Their scores in the table above are unreliable in both directions.' },
        { label: 'Bias toward well-represented classes:', body: 'When uncertain, the model drifts toward the types it saw most. Weighted sampling reduces this but does not remove it — a confident "Granite" on an ambiguous photo may just be the prior talking.' },
        { label: 'Small validation split:', body: 'Metrics and the confusion matrix are computed on a 20% hold-out. For thin classes that is a couple of images, so one error moves the number by tens of percentage points. Treat per-class figures as indicative, not precise.' },
        { label: 'Visual similarity:', body: 'Gneiss vs. Schist and Chalk vs. Limestone share visual features. These confusions are visible in the matrix above and are genuinely hard — geologists use hardness, reaction to acid and grain structure, none of which a photo captures.' },
        { label: 'Mixed photographic scale:', body: 'Most training images are hand samples on neutral backgrounds, but roughly one in six is a field or outcrop shot that survived filtering. The model therefore sees the same rock at very different scales, which blurs what it learns. Close-up photos of a single specimen are what it handles best.' },
        { label: 'Limited to 25 types:', body: 'There is no "unknown" option. Rocks outside this catalogue are forced into the closest match and still reported with a confidence score.' },
        { label: 'Demonstration tool:', body: 'Not for professional geological assessment — always verify with a specialist.' },
        { label: 'Image quality dependent:', body: 'Blurry, dark or distant photos produce unreliable results.' },
      ],
    } satisfies Localized<{ label: string; body: string }[]>,

    tipsTitle: { es: 'Consejos para mejores resultados', en: 'Tips for Best Results' } satisfies Localized<string>,
    tips: {
      es: [
        'Usa luz natural y difusa; evita sombras duras o flash.',
        'Fotografía tanto la superficie fresca como la meteorizada, si puedes.',
        'Incluye una referencia de escala cercana (una moneda, un bolígrafo).',
        'Mantén la roca centrada y que ocupe el mayor espacio posible del encuadre.',
        'Un fondo liso (papel blanco, superficie plana) reduce el ruido.',
        'Resolución mínima de 224×224 píxeles; cuanto más, mejor.',
      ],
      en: [
        'Use natural, diffused lighting — avoid harsh shadows or flash.',
        'Photograph both fresh and weathered surfaces when possible.',
        'Include a scale reference (coin, pen) nearby for context.',
        'Keep the rock centered and fill the frame as much as possible.',
        'A plain background (white paper, flat surface) reduces noise.',
        'Minimum resolution of 224×224 pixels — higher is better.',
      ],
    } satisfies Localized<string[]>,

    techTitle: { es: 'Tecnologías', en: 'Technology Stack' } satisfies Localized<string>,
    techRoles: {
      es: {
        'React 18': 'Interfaz',
        TypeScript: 'Tipado seguro',
        'Tailwind CSS': 'Estilos',
        'Framer Motion': 'Animaciones',
        'ONNX Runtime': 'Inferencia en producción',
        PyTorch: 'Entrenamiento',
        TorchVision: 'Modelos de imagen',
        Pillow: 'Procesamiento de imagen',
      },
      en: {
        'React 18': 'Frontend UI',
        TypeScript: 'Type safety',
        'Tailwind CSS': 'Styling',
        'Framer Motion': 'Animations',
        'ONNX Runtime': 'Production inference',
        PyTorch: 'Training',
        TorchVision: 'Image Models',
        Pillow: 'Image Processing',
      },
    } satisfies Localized<Record<string, string>>,

    cta: { es: 'Pruébalo ahora', en: 'Try It Now' } satisfies Localized<string>,
  },
} as const

/** Category label for the filter pills and card badges. */
export function categoryLabel(cat: RockCategory | 'all', locale: Locale): string {
  return ui.categories[cat][locale]
}
