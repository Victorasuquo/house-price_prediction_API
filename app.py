# app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import json
import numpy as np
from predict import load_artifacts, predict

# Load artifacts once at startup
model, config = load_artifacts()

# Create FastAPI app
app = FastAPI(description="ML model served with FastAPI for House Price Predictions")
app.title = "House Price Prediction API"

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

# Optional: run with uvicorn when script executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)