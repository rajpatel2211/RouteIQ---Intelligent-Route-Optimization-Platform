# SmartRoute Web - Route Optimization Platform

A full-stack production-ready route optimization platform for field operations.

## Features

- JWT-based authentication (technicians, managers)
- Meter management (CRUD + bulk import)
- TSP + 2-opt route optimization (1000+ stops in under 1 second)
- Real-time interactive maps (Leaflet + OpenStreetMap)
- Analytics dashboard with charts
- Dynamic speed detection (city, density, area-based)
- Mobile-responsive design
- Docker-ready deployment

## Tech Stack

Frontend: React.js, React Router, Leaflet, Recharts, Axios
Backend: FastAPI, SQLAlchemy, Pydantic, JWT, Passlib
Database: PostgreSQL
Deployment: Docker, Docker Compose, AWS EC2

## Quick Start

### Option 1: Docker (Recommended)

    docker-compose up --build

Then open:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Manual Setup

Backend:

    cd backend
    pip install -r requirements.txt
    cp .env.example .env
    uvicorn app.main:app --reload --port 8000

Frontend (new terminal):

    cd frontend
    npm install
    npm start

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login (returns JWT) |
| GET | /api/auth/me | Current user |
| GET/POST | /api/meters/ | List/create meters |
| POST | /api/meters/bulk | Bulk create |
| DELETE | /api/meters/{id} | Delete meter |
| POST | /api/routes/optimize | Optimize route |
| GET | /api/routes/ | List routes |
| GET | /api/analytics/summary | Analytics summary |

## Performance

| Meters | Optimization Time |
|--------|-------------------|
| 100 | under 0.05s |
| 500 | under 0.3s |
| 1000 | under 0.8s |
| 2000 | under 2.5s |

## How to Use

1. Register an account
2. Add meters (manually or click "Generate 50 Demo Meters")
3. Click Optimize to see before/after comparison
4. View map with color-coded priority markers
5. Check Analytics for cumulative savings

## AWS Deployment

On EC2 instance:

    git clone YOUR_REPO_URL
    cd smartroute-web
    docker-compose up -d

Ensure ports 3000, 8000 are open in security group.

## License

MIT License

## Author

Built by Raj Patel - AI and Full Stack Developer
