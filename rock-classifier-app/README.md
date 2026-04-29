# Rock Classifier App

Web application for rock classification using Deep Learning (ResNet50).

## Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: FastAPI + PyTorch + TorchVision
- **ML Model**: ResNet50 (ImageNet pre-trained, transfer learning)

## Despliegue recomendado

### Backend (FastAPI)
1. Crear y activar un entorno virtual:
	```bash
	cd backend
	python -m venv venv
	source venv/bin/activate  # o venv\Scripts\activate en Windows
	pip install -r requirements.txt
	```
2. Configurar variables de entorno:
	- `FRONTEND_URL`: URL del frontend desplegado (por ejemplo, https://tu-app.vercel.app)
	- Otras variables opcionales en `.env`
3. Ejecutar el backend:
	```bash
	uvicorn app.main:app --host 0.0.0.0 --port 8000
	```

### Frontend (Vercel)
1. En la carpeta `frontend`, crear un archivo `.env` con:
	```env
	VITE_API_URL=https://<tu-backend>
	```
2. Instalar dependencias y construir:
	```bash
	npm install
	npm run build
	```
3. Desplegar en Vercel siguiendo la documentación oficial.

## Endpoints principales
- `POST /api/predict` (o `/api/classify/rock`): Clasificación de imagen de roca
- `GET /api/reference/rocks`: Catálogo de rocas
- `GET /api/health`: Health check

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
Desarrollado por [Tu Nombre].

## Licencia

MIT

---
