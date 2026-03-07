# Rock Classifier App

Web application for rock classification using Deep Learning (ResNet50).

## Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: FastAPI + PyTorch + TorchVision
- **ML Model**: ResNet50 (ImageNet pre-trained, transfer learning)

## Quick Start

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

### Access
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health

## Rock Types (25 Classes)
Granite, Basalt, Limestone, Sandstone, Shale, Slate, Marble, Quartzite, Gneiss, Schist, Diorite, Pegmatite, Obsidian, Pumice, Andesite, Rhyolite, Conglomerate, Breccia, Tuff, Flint, Chalk, Dolomite, Dunite, Syenite, Porphyry

## Features
- Drag & drop image upload
- Real-time classification with confidence scores
- Geological information (formation, composition, uses)
- Top 5 alternative matches
- Responsive design
