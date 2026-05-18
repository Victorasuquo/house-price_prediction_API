# predict.py
import joblib
import json
import sys
import argparse

def load_artifacts():
    """Load model and config from disk."""
    model = joblib.load("model_artifacts/model.pkl")
    with open("model_artifacts/config.json", "r") as f:
        config = json.load(f)
    return model, config

def predict(model, features):
    """Make prediction given a list of feature values."""
    # features order must match config['features']
    prediction = model.predict([features])[0]
    return prediction

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict house price")
    parser.add_argument("--size", type=float, required=True, help="Size in sq ft")
    parser.add_argument("--bedrooms", type=int, required=True, help="Number of bedrooms")
    parser.add_argument("--age", type=float, required=True, help="Age in years")

    args = parser.parse_args()

    # Load model & config
    model, config = load_artifacts()
    
    # Prepare features in the exact order used during training
    feature_order = config["features"]
    features = [args.size, args.bedrooms, args.age]  # order: size, bedrooms, age
    
    
    # Predict
    pred_price = predict(model, features)
    
    print(f"\n🏠 Predicted house price: ${pred_price:,.2f}")
    print(f"   (Model: {config['model_type']})")