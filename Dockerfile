FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy trained model artifacts
COPY model_artifacts ./model_artifacts/

# Copy FastAPI app and prediction module
COPY app.py .
COPY predict.py .

EXPOSE 8080

# Run uvicorn server — use PORT env var for Cloud Run compatibility
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-8080}