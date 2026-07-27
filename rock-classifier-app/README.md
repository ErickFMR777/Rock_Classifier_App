# Rock Classifier App

Clasificador de rocas por imagen con Deep Learning. Sube una foto y el modelo la
identifica entre 25 tipos de roca, con información geológica y las cinco
alternativas más probables.

## Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Framer Motion (Vite)
- **Backend**: FastAPI + PyTorch 2.13 (CPU)
- **Modelo**: ResNet18 con transfer learning desde ImageNet

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
correlación con el número de imágenes por clase es directa. La página **About** de
la app muestra la matriz de confusión completa y el reparto real del dataset.

> Es una herramienta de demostración, no de evaluación geológica profesional.

---

## Arquitectura de despliegue

La aplicación se despliega en **dos servicios separados**:

```
┌─────────────────────────┐        VITE_API_URL        ┌──────────────────────────┐
│  Frontend (React/Vite)  │ ─────────────────────────► │  Backend (FastAPI+Torch) │
│       Vercel            │ ◄───────────────────────── │  Render / Railway / Fly  │
└─────────────────────────┘        FRONTEND_URL        └──────────────────────────┘
                                     (CORS)
```

> **El backend no puede desplegarse en Vercel.** Sus funciones serverless tienen un
> límite de 250 MB descomprimidos y solo el wheel de `torch` ya lo excede.

Las secciones **Rock Catalog** y **About** funcionan sin backend (usan datos del
bundle). Solo el clasificador requiere `VITE_API_URL`; si falta, la app muestra un
aviso claro en lugar de fallar.

## 1. Desplegar el frontend en Vercel

El repositorio incluye [`vercel.json`](../vercel.json) en la raíz, que ya apunta al
subdirectorio correcto. No hace falta configurar *Root Directory* en el dashboard.

1. Importa el repositorio en Vercel.
2. En **Settings → Environment Variables** añade `VITE_API_URL` con la URL del
   backend desplegado. Se acepta con o sin sufijo `/api`; el cliente lo normaliza.
3. Deploy.

> `VITE_API_URL` se inyecta en **tiempo de build**. Si la cambias, hay que
> redesplegar para que surta efecto.

## 2. Desplegar el backend

### Opción A — Render (blueprint incluido)

1. En Render: **New → Blueprint** y selecciona el repositorio ([`render.yaml`](../render.yaml)).
2. Configura `FRONTEND_URL` con tu dominio de Vercel, sin barra final.
3. Deploy. El healthcheck es `/api/health`.

### Opción B — Docker

```bash
cd rock-classifier-app
docker build -t rock-classifier-api -f Dockerfile .
docker run -p 8000:8000 -e FRONTEND_URL=https://tu-app.vercel.app rock-classifier-api
```

El `Dockerfile` instala **torch CPU-only**, lo que mantiene la imagen cerca de 1 GB
en lugar de más de 5 GB con CUDA.

> ⚠️ **El modelo se carga una sola vez al arrancar.** Si actualizas
> `rock_classifier.pt`, hay que **reiniciar el servicio**: subir el archivo no basta,
> el proceso en marcha seguirá sirviendo los pesos antiguos sin dar ningún error.

### Variables de entorno del backend

| Variable | Descripción | Por defecto |
|---|---|---|
| `PORT` | Puerto de escucha (lo inyecta la plataforma) | `8000` |
| `FRONTEND_URL` | Origen del frontend en producción, para CORS | — |
| `ALLOWED_ORIGINS` | Orígenes extra separados por coma | — |
| `VERCEL_PREVIEW_REGEX` | Regex de CORS para *preview deployments* | `^https://.*\.vercel\.app$` |
| `MODELS_DIR` | Ruta a pesos y clases | `../models` |
| `API_RELOAD` | Auto-reload (solo desarrollo) | `false` |
| `LOG_LEVEL` | Nivel de logging | `INFO` |

Vercel genera un dominio distinto en cada *preview deployment*, así que una lista
fija de orígenes nunca los cubriría; de ahí el regex.

---

## Desarrollo local

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate     # venv\Scripts\activate en Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

No hace falta `VITE_API_URL` en desarrollo: Vite hace proxy de `/api` a
`http://localhost:8000` (configurable con `BACKEND_ORIGIN`).

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/classify/rock` | Clasificación de imagen |
| `GET` | `/api/reference/rocks` | Catálogo de rocas |
| `GET` | `/api/reference/rocks/{name}` | Detalle de un tipo |
| `GET` | `/api/model/metrics` | Métricas del entrenamiento |
| `GET` | `/api/health` | Health check |

Respuesta de `/api/classify/rock`:
```json
{
  "primary": { "class": "Granite", "confidence": 0.87, "type": "Igneous - Intrusive", "...": "..." },
  "alternatives": [{ "class": "Diorite", "confidence": 0.06 }],
  "inference_time_ms": 412
}
```

Hay un límite de **30 peticiones por minuto y por IP**. La IP se resuelve desde
`X-Forwarded-For`, porque detrás del proxy de Render todas las peticiones llegarían
con la misma dirección y compartirían un único cupo.

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
python train_v2.py
```

Unos **156 minutos en CPU** (8 hilos, lote 32, 30 épocas). Produce
`models/rock_classifier.pt` y `models/metrics.json`.

**Es reanudable.** Escribe `models/checkpoint_last.pt` después de cada época con el
estado del modelo, el optimizador y el scheduler; si el proceso muere, la siguiente
ejecución continúa desde la última época completada en vez de empezar de cero. Ese
checkpoint pesa 168 MB y está excluido de git a propósito.

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
