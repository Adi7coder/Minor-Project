# CleanBLR Platform

CleanBLR is an AI-powered platform for reporting and managing illegal garbage dumps in Bangalore. It enables citizens to report dumps with automatic GPS capture and provides municipal authorities with a comprehensive dashboard to track clean-up operations.

## Architecture

1. **Citizen Portal (`/frontend-citizen`)**: A mobile-first React + Vite application that enables users to upload photos with accurate geolocation.
2. **Municipal Dashboard (`/frontend-municipal`)**: A React + Vite dashboard for BBMP officials with KPIs, interactive maps, and detailed reporting tables.
3. **Backend API (`/backend`)**: An async FastAPI service serving REST endpoints connected to a PostgreSQL database with PostGIS for spatial data handling.
4. **ML Service (`/ml-service`)**: A simulated YOLOv8 computer vision detection endpoint running on FastAPI to automatically verify garbage presence.

## Setup Instructions

### Prerequisites
- Docker & Docker Compose
- Node.js > 18.0
- Python 3.11+

### 1. Database Setup
```bash
cd docker
docker-compose up -d
```
This spins up a PostGIS-enabled PostgreSQL database and a Redis server.

### 2. Backend API
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000
```
*Make sure to configure the root `.env` file first based on `.env.example`.*

### 3. ML Service (YOLOv8 Mock)
```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 4. Frontends
For the Citizen Portal:
```bash
cd frontend-citizen
npm install
npm run dev
```

For the Municipal Dashboard:
```bash
cd frontend-municipal
npm install
npm run dev
```

## Features Implemented
- **Mobile First Citizen Reporting**: Image capture UI and high-accuracy GPS logic using `navigator.geolocation`.
- **JWT Authentication Flow**: Asymmetric route protection on the FastAPI endpoints.
- **BBMP Analytics & Tables**: Configured with Recharts and Tailwind CSS.
- **Async Database Connection**: Enabled fast connection pooling using `asyncpg` and SQLAlchemy.

## Deployment
For production, use standard Dockerfile specifications per service inside `/docker` and deploy using Kubernetes (`/kubernetes` manifests).
