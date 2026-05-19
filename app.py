# app.py
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import joblib
import json
import numpy as np
from predict import load_artifacts, predict

# Load artifacts once at startup
model, config = load_artifacts()

# Create FastAPI app — Swagger UI available at /docs
app = FastAPI(
    title="House Price Prediction API",
    description="ML model served with FastAPI for House Price Predictions",
    docs_url="/docs",
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request body schema
class PredictionRequest(BaseModel):
    size: float      # sq ft
    bedrooms: int
    age: float       # years

class PredictionResponse(BaseModel):
    predicted_price_usd: float

@app.get("/health", status_code=200)
def health_check():
    return {"status": "ok", "model_type": config["model_type"]}

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    try:
        # Features must follow the order used in training: size, bedrooms, age
        features = [[request.size, request.bedrooms, request.age]]
        prediction = model.predict(features)[0]
        return PredictionResponse(predicted_price_usd=round(prediction, 2))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Serve frontend static files ---
# Determine the frontend directory (works both locally and in Docker)
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")

@app.get("/", include_in_schema=False)
async def serve_frontend():
    """Serve the frontend index.html at the root URL."""
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# Mount static files (CSS, JS) — this must come after route definitions
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# Optional: run with uvicorn when script executed directly
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)