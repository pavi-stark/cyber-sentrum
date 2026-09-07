import os
import json
import pandas as pd
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from app.ml.train_model import (
    IdentityMatcherTrainer,
    get_trained_model,
    predict_identity_authenticity,
    REPORT_FILE_PATH,
    MODEL_FILE_PATH
)
from app.ml.dataset_generator import (
    DATASET_CSV_PATH,
    DATASET_JSON_PATH,
    FEATURE_COLUMNS,
    CLASS_LABELS,
    generate_synthetic_identity_dataset,
    save_dataset
)

router = APIRouter(prefix="/api/ml", tags=["AI Identity Matching & Model Hub"])

class InferenceRequest(BaseModel):
    features: Dict[str, float]

class DatasetGenerateRequest(BaseModel):
    n_samples: Optional[int] = 1600

@router.get("/status")
def get_ml_model_status():
    """Returns current model status, evaluation metrics, and feature importances"""
    if os.path.exists(REPORT_FILE_PATH):
        try:
            with open(REPORT_FILE_PATH, "r", encoding="utf-8") as f:
                report = json.load(f)
            return {
                "success": True,
                "is_trained": True,
                "model_available": os.path.exists(MODEL_FILE_PATH),
                "metrics": report
            }
        except Exception as e:
            pass

    # If not trained yet, trigger quick training
    trainer = IdentityMatcherTrainer()
    report = trainer.train_and_evaluate()
    return {
        "success": True,
        "is_trained": True,
        "model_available": True,
        "metrics": report
    }

@router.post("/train")
def train_ai_model():
    """Triggers end-to-end model training on the identity dataset"""
    try:
        trainer = IdentityMatcherTrainer()
        report = trainer.train_and_evaluate()
        return {
            "success": True,
            "message": "AI Ensemble Model successfully trained on 1,600 multi-modal identity records!",
            "metrics": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@router.get("/dataset")
def get_dataset_overview():
    """Returns dataset summary, class distributions, and sample records"""
    if not os.path.exists(DATASET_CSV_PATH):
        df = generate_synthetic_identity_dataset(n_samples=1600)
        save_dataset(df)
    else:
        df = pd.read_csv(DATASET_CSV_PATH)

    class_dist = {
        CLASS_LABELS[k]: int(v)
        for k, v in df['label'].value_counts().to_dict().items()
    }

    # Calculate feature summary stats
    feature_stats = []
    for col in FEATURE_COLUMNS:
        feature_stats.append({
            "feature": col,
            "mean": round(float(df[col].mean()), 4),
            "std": round(float(df[col].std()), 4),
            "min": round(float(df[col].min()), 4),
            "max": round(float(df[col].max()), 4)
        })

    samples = df.head(15).to_dict(orient="records")

    return {
        "success": True,
        "total_samples": len(df),
        "feature_count": len(FEATURE_COLUMNS),
        "features": FEATURE_COLUMNS,
        "class_distribution": class_dist,
        "feature_stats": feature_stats,
        "sample_records": samples
    }

@router.post("/predict")
def run_ml_prediction(payload: InferenceRequest):
    """Executes real-time ML identity matching inference"""
    try:
        result = predict_identity_authenticity(payload.features)
        return {
            "success": True,
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
