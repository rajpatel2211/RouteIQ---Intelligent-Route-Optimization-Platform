"""SmartRoute FastAPI Application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.routers import auth, meters, routes, analytics

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME, description="SmartRoute - Route Optimization API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(meters.router)
app.include_router(routes.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "version": "1.0.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
