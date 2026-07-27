# Rock Classifier App

Web application for rock classification using Deep Learning (ResNet50).

## Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion (Vite)
- **Backend**: FastAPI + PyTorch + TorchVision
- **ML Model**: ResNet50 (ImageNet pre-trained, transfer learning)

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

> **El backend no puede desplegarse en Vercel.** Las funciones serverless de Vercel
> tienen un límite de 250 MB descomprimidos y solo el wheel de `torch` ya lo excede.
> Por eso el servicio de inferencia vive en una plataforma con contenedores.

Las secciones **Rock Catalog** y **About** funcionan sin backend (usan datos incluidos
en el bundle). Solo el clasificador requiere `VITE_API_URL`; si no está configurada,
la app muestra un aviso claro en lugar de fallar.

---

## 1. Desplegar el frontend en Vercel

El repositorio incluye [`vercel.json`](../vercel.json) en la raíz, que ya apunta al
subdirectorio correcto. No hace falta configurar el *Root Directory* en el dashboard.

1. Importa el repositorio en Vercel.
2. En **Settings → Environment Variables**, añade:

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | URL del backend desplegado, p. ej. `https://rock-classifier-api.onrender.com` |

   Se acepta con o sin el sufijo `/api`; el cliente lo normaliza.
3. Deploy.

Vercel ejecutará:
```bash
npm install --prefix rock-classifier-app/frontend
npm run build  --prefix rock-classifier-app/frontend
# output: rock-classifier-app/frontend/dist
```

> `VITE_API_URL` se inyecta en **tiempo de build**, no en runtime. Si la cambias,
> hay que volver a desplegar para que surta efecto.

## 2. Desplegar el backend

### Opción A — Render (blueprint incluido)

El repositorio incluye [`render.yaml`](../render.yaml) y un `Dockerfile`.

1. En Render: **New → Blueprint**, selecciona el repositorio.
2. Configura `FRONTEND_URL` con tu dominio de Vercel (sin barra final).
3. Deploy. El healthcheck es `/api/health`.

### Opción B — Docker en cualquier plataforma

```bash
cd rock-classifier-app
docker build -t rock-classifier-api -f Dockerfile .
docker run -p 8000:8000 -e FRONTEND_URL=https://tu-app.vercel.app rock-classifier-api
```

El `Dockerfile` instala **torch CPU-only** (índice `download.pytorch.org/whl/cpu`),
lo que mantiene la imagen cerca de 1 GB en lugar de más de 5 GB con CUDA.

### Variables de entorno del backend

| Variable | Descripción | Por defecto |
|---|---|---|
| `PORT` | Puerto de escucha (lo inyecta la plataforma) | `8000` |
| `FRONTEND_URL` | Origen del frontend en producción, para CORS | — |
| `ALLOWED_ORIGINS` | Orígenes extra separados por coma (dominios propios) | — |
| `VERCEL_PREVIEW_REGEX` | Regex de CORS para *preview deployments* de Vercel | `^https://.*\.vercel\.app$` |
| `MODELS_DIR` | Ruta a los pesos y clases del modelo | `../models` |
| `API_RELOAD` | Auto-reload (solo desarrollo) | `false` |
| `LOG_LEVEL` | Nivel de logging | `INFO` |

Vercel genera un dominio distinto en cada *preview deployment*, por lo que una lista
fija de orígenes nunca los cubriría. De ahí `VERCEL_PREVIEW_REGEX`. Si solo quieres
permitir el dominio de producción, déjala vacía y usa `FRONTEND_URL`.

## 3. Pesos del modelo (importante)

Los archivos `*.pt` están en `.gitignore` por tamaño, así que **no viajan en el repositorio**.
Sin ellos el backend arranca igual, pero con la última capa inicializada al azar:
responde, y las predicciones no son válidas.

Para inferencia real, incluye `rock_classifier.pt` en `models/` antes de construir la
imagen, o descárgalo en el arranque desde almacenamiento externo. El log lo advierte:

```
WARNING  Rock model weights not found: .../rock_classifier.pt
INFO     Using ImageNet pre-trained model with random final layer
```

---

## Desarrollo local

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # venv\Scripts\activate en Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

En desarrollo no hace falta `VITE_API_URL`: Vite hace proxy de `/api` a
`http://localhost:8000` (configurable con `BACKEND_ORIGIN`).

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/classify/rock` | Clasificación de imagen de roca |
| `GET` | `/api/reference/rocks` | Catálogo de rocas |
| `GET` | `/api/reference/rocks/{name}` | Detalle de un tipo de roca |
| `GET` | `/api/model/metrics` | Métricas de entrenamiento (si existen) |
| `GET` | `/api/health` | Health check |

Respuesta de `/api/classify/rock`:
```json
{
  "primary": { "class": "Granite", "confidence": 0.87, "type": "Igneous - Intrusive", "...": "..." },
  "alternatives": [{ "class": "Diorite", "confidence": 0.06 }],
  "inference_time_ms": 412
}
```

## Características
- Drag & drop image upload
- Real-time classification with confidence scores
- Geological information (formation, composition, uses)
- Top 5 alternative matches
- Responsive design

## Clases de roca soportadas (25)
Granite, Basalt, Limestone, Sandstone, Shale, Slate, Marble, Quartzite, Gneiss, Schist, Diorite, Pegmatite, Obsidian, Pumice, Andesite, Rhyolite, Conglomerate, Breccia, Tuff, Flint, Chalk, Dolomite, Dunite, Syenite, Porphyry

---

## Limitaciones del modelo y precisión

⚠️ **La precisión del modelo depende directamente del tamaño y el balance del dataset de entrenamiento.**

- Algunas clases de roca tienen menos imágenes disponibles, lo que puede afectar negativamente la exactitud de la predicción para esas clases (desbalance de datos).
- El modelo puede ser menos confiable para clases poco representadas o con imágenes de baja calidad.
- La principal forma de mejorar el rendimiento y la precisión del modelo es:
	- Recolectar más imágenes etiquetadas para cada clase.
	- Balancear el número de ejemplos por clase.
	- Mejorar la calidad y diversidad de las imágenes.

**Recomendación:** Si deseas aumentar la precisión, enfócate en recolectar y etiquetar más imágenes, especialmente para las clases menos representadas.

---

## Licencia

MIT
