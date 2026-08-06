# Rock Classifier App

Clasificador de rocas por imagen con Deep Learning. Sube una foto y el modelo la
identifica entre 25 tipos de roca, con información geológica y las cinco
alternativas más probables.

**En producción:** https://rock-classifier-app-erickfmr777s-projects.vercel.app

## Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Framer Motion (Vite)
- **Inferencia**: funciones Python serverless en Vercel con onnxruntime
- **Modelo**: ResNet18 con transfer learning desde ImageNet, exportado a ONNX
- **Entrenamiento**: PyTorch 2.13 (solo local, no se despliega)

---

## Rendimiento del modelo

Medido sobre el conjunto de validación retenido (298 imágenes, 20 % estratificado):

| Métrica | Valor |
|---|---|
| **Top-1** | **40.6 %** |
| Top-3 | 61.1 % |
| Top-5 | 70.8 % |
| Macro (P / R / F1) | 42.2 % / 39.9 % / 39.6 % |
| Weighted (P / R / F1) | 43.6 % / 40.6 % / 40.6 % |

El azar con 25 clases es 4 %, así que el modelo aprende señal real. **Top-5 es la
cifra relevante para el uso**: la pantalla de resultados muestra cinco candidatos.

**Rendimiento muy desigual entre clases.** Chalk 83 % F1, Diorite 77 %, Slate 62 %;
en el extremo opuesto Pumice acierta 0 de 6 y Dolomite tiene 14 % de recall. La
correlación con el número de imágenes por clase es directa. La página **About**
muestra la matriz de confusión completa y el reparto real del dataset.

Latencia en producción: **57–152 ms** por imagen.

> Es una herramienta de demostración, no de evaluación geológica profesional.

---

## Arquitectura

Todo vive en **un único despliegue de Vercel**. No hay segundo servicio, ni CORS,
ni arranque en frío de un backend dormido.

```
Vercel
├── Frontend estático (Vite build)  →  /
└── Funciones Python (onnxruntime)  →  /api/*
    └── api/_lib/rock_classifier.onnx   (45 MB)
```

**Por qué ONNX y no PyTorch.** El wheel de `torch` por sí solo excede el límite de
250 MB por función de Vercel. `onnxruntime` + `numpy` + `pillow` + el modelo suman
unos 146 MB, que sí cabe.

**No es otro modelo.** El grafo ONNX es una conversión de formato del checkpoint
entrenado, verificada por `export_onnx.py`: diferencia máxima de logits de ~3e-06
frente a PyTorch y cero discrepancias de clase. El script aborta si eso deja de
cumplirse.

### Endpoints

| Método | Ruta | Fichero |
|---|---|---|
| `POST` | `/api/classify/rock` | `api/classify/rock.py` |
| `GET` | `/api/reference/rocks` | `api/reference/rocks.py` |
| `GET` | `/api/model/metrics` | `api/model/metrics.py` |
| `GET` | `/api/health` | `api/health.py` |

Respuesta de `/api/classify/rock`:
```json
{
  "primary": { "class": "Diorite", "confidence": 0.894, "type": "Igneous - Intrusive", "...": "..." },
  "alternatives": [{ "class": "Dunite", "confidence": 0.03 }],
  "inference_time_ms": 152
}
```

`api/_lib/rocks.json` es la **fuente única** de los datos geológicos: lo leen tanto
el catálogo como el enriquecimiento de la predicción, así que no pueden divergir.

---

## Despliegue

El repositorio está conectado a Vercel: **cada push a `main` despliega solo**. No
hay variables de entorno obligatorias.

Despliegue manual desde el CLI:
```bash
vercel deploy --prod
```

### Ajustes del proyecto que deben permanecer así

Estos tres causaron 14 horas de despliegues fallidos y **no se arreglan tocando el
código** — viven en la configuración del proyecto en Vercel:

| Ajuste | Valor correcto | Si se rompe |
|---|---|---|
| **Root Directory** | *(vacío / raíz)* | Con `rock-classifier-app/backend`, el install command busca un `package.json` duplicado inexistente y el build falla |
| **Framework Preset** | *(Other / null)* | Con `fastapi` interfiere con el build del frontend |
| **Deployment Protection** | *(desactivado)* | Con SSO activo y sin dominio propio, toda la app queda tras el login de Vercel |

### Restricciones del runtime

- Vercel ejecuta **CPython 3.12**. `onnxruntime` solo publica wheels `cp312` desde
  la versión **1.24**; un pin anterior falla al resolver dependencias en el build.
- El parseo multipart usa `email` de la stdlib, **no `cgi`**: ese módulo fue
  eliminado en Python 3.13 y rompería la función en cuanto Vercel actualice.
- El rewrite SPA de `vercel.json` excluye `/api/*`. Sin esa exclusión, el catch-all
  se traga las llamadas a la API y devuelve el HTML.

### Alternativa: backend en contenedor

Se conservan `Dockerfile` y `render.yaml` por si algún día conviene servir la
inferencia con PyTorch en Render, Railway o Fly. En ese caso hay que definir
`VITE_API_URL` en Vercel apuntando al servicio, y `FRONTEND_URL` en el backend
para el CORS. **No es necesario para el despliegue actual.**

> Si usas esa vía: el modelo se carga una sola vez al arrancar, así que reemplazar
> los pesos exige **reiniciar el servicio**. Subir el archivo no basta y no da
> ningún aviso.

---

## Desarrollo local

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Vite hace proxy de `/api` a `http://localhost:8000`, así que para el clasificador
hace falta levantar el backend FastAPI:

```bash
cd backend
python -m venv venv
source venv/bin/activate     # venv\Scripts\activate en Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> `backend/` mantiene la implementación FastAPI+PyTorch para desarrollo y como
> alternativa en contenedor. **Lo que corre en producción es `api/`.**

---

## Dataset

**1481 imágenes, 25 clases**, construidas desde **Wikimedia Commons**, que re-aloja
fotografía de especímenes de fuentes reconocidas — en particular **GeoDIL**
(Geoscience Digital Image Library), cuyas muestras de mano se fotografían sobre
fondo neutro.

Las imágenes **no se versionan** (unos 150 MB); se regeneran con el script. Sí se
versiona [`dataset/MANIFEST.json`](dataset/MANIFEST.json), que registra licencia,
autor y URL de origen de cada imagen para que la atribución sea auditable.

```bash
cd backend/train
python download_commons.py            # las 25 clases
python download_commons.py --topup    # refuerzo de clases escasas
python download_commons.py Granite    # una sola clase
```

El descargador es **reanudable**: deduplica por título contra el manifiesto, así que
volver a ejecutarlo continúa donde quedó en vez de duplicar imágenes.

**Filtrado.** No se usan listados de categoría de Commons: `Category:Granite`
devuelve paisajes, edificios y encimeras. El script combina búsqueda de texto
dirigida, una lista negra por clase para las trampas reales (Flint la ciudad de
Michigan, Chalk las pizarras escolares, Dolomite los Dolomitas, Marble las
esculturas) y un filtro por **descripción y categorías** que descarta microscopía.
Este último es imprescindible: GeoDIL titula una sección delgada
`Alkalic granite (GeoDIL number - 1515)`, indistinguible por el nombre de una
muestra de mano, pero su descripción dice *"plain polarized thin section"*.

Reparto por clase: 16 clases llegan a las 70 imágenes objetivo; las más escasas son
Andesite (23), Pumice (30) y Quartzite (35). No es un descuido — no existe más
fotografía de espécimen con licencia abierta para esos tipos, y se probaron
consultas en alemán, español y francés además de variedades petrológicas.

## Entrenamiento

```bash
cd backend/train
python train_v2.py        # ~156 min en CPU (8 hilos, lote 32, 30 épocas)
python export_onnx.py     # genera el ONNX que se despliega
```

`train_v2.py` produce `models/rock_classifier.pt` y `models/metrics.json`.
`export_onnx.py` produce `models/rock_classifier.onnx`, que hay que copiar a
`api/_lib/` junto con `metrics.json` para que el despliegue los recoja.

**Es reanudable.** Escribe `models/checkpoint_last.pt` después de cada época con el
estado del modelo, el optimizador y el scheduler; si el proceso muere, la siguiente
ejecución continúa desde la última época completada. Ese checkpoint pesa 168 MB y
está excluido de git a propósito.

Técnicas: transfer learning desde ImageNet, mixup (α=0.2), label smoothing (0.1),
muestreo ponderado para compensar el desbalance, cosine annealing con warm restarts,
gradient clipping y augmentación geométrica y de color agresiva.

**El split train/val está estratificado**: cada clase aporta el mismo porcentaje a
validación (20–22 %). Con `random_split` sin estratificar, medido sobre este
dataset, Basalt aportaba un 11 % y Quartzite un 34 %, lo que hacía incomparables las
métricas por clase y añadía un desbalance no intencionado sobre el que ya existe.

### Clases soportadas (25)
Granite, Basalt, Limestone, Sandstone, Shale, Slate, Marble, Quartzite, Gneiss,
Schist, Diorite, Pegmatite, Obsidian, Pumice, Andesite, Rhyolite, Conglomerate,
Breccia, Tuff, Flint, Chalk, Dolomite, Dunite, Syenite, Porphyry

---

## Limitaciones

- **Dataset pequeño.** Unas decenas de imágenes por clase, no los miles que necesita
  un clasificador robusto. Es la mayor restricción sobre la exactitud, por encima de
  la arquitectura o los hiperparámetros. La brecha entre train (77 %) y validación
  (40.6 %) lo refleja.
- **Cobertura desigual.** Algunas clases no pudieron representarse bien porque la
  fotografía con licencia abierta es abundante para rocas comunes y escasa para las
  raras. Sus métricas son poco fiables en ambas direcciones.
- **Sesgo hacia las clases mejor representadas.** Ante la duda el modelo tiende a los
  tipos que más vio. El muestreo ponderado lo reduce pero no lo elimina.
- **Validación pequeña.** En las clases escasas son cinco o seis imágenes, así que un
  solo error mueve la métrica decenas de puntos.
- **Similitud visual real.** Gneiss/Schist y Chalk/Limestone comparten rasgos que una
  foto no distingue; un geólogo usa dureza, reacción al ácido y estructura del grano.
- **Escala fotográfica mixta.** La mayoría son muestras de mano, pero cerca de una de
  cada seis es una foto de campo que sobrevivió al filtrado. Funciona mejor con
  primeros planos de un espécimen.
- **Solo 25 tipos, sin opción "desconocido".** Una roca fuera del catálogo se fuerza
  a la clase más cercana y se reporta igualmente con un porcentaje de confianza.

Para mejorar la exactitud, el camino es **más datos**, no otra arquitectura:
recolectar más imágenes etiquetadas y equilibrar las clases escasas.

---

## Licencia

MIT. Las imágenes de entrenamiento provienen de Wikimedia Commons bajo sus
respectivas licencias (CC0, CC-BY, CC-BY-SA), registradas en `dataset/MANIFEST.json`.
