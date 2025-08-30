# app.py - Updated with Natural Decision Boundary (matches notebook exactly)

from flask import Flask, request, jsonify
from flask_cors import CORS
import os, io, time
import numpy as np
import pandas as pd
from typing import Optional, Dict, List
from joblib import load as joblib_load

# =========================
# Config / Globals
# =========================

MODEL = None
# REMOVED THRESHOLD - using natural decision boundary instead

# Map model class names -> UI policy labels
CLASS_TO_UI = {
    "advertisement": "Advertisement",
    "feedback": "Clean Review", 
    "irrelevant": "Irrelevant",
    "rant": "Rant (no visit)",
}
UI_LABELS = ["Advertisement", "Irrelevant", "Rant (no visit)", "Clean Review"]

# Define which classes are violations
VIOLATION_CLASSES = {"advertisement", "irrelevant", "rant"}

LOAD_ERROR: Optional[str] = None
CANDIDATE_STATUS: List[tuple] = []

# =========================
# Model loading
# =========================

def _candidate_model_paths():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.environ.get("MODEL_PATH")
    
    paths = []
    if env_path:
        paths.append(env_path)
    
    for name in ["rf_model_pipeline.joblib", "model.joblib"]:
        paths.append(os.path.join(base_dir, name))
        paths.append(os.path.join(os.getcwd(), name))
    
    return paths

def _load_model():
    global MODEL, LOAD_ERROR, CANDIDATE_STATUS
    LOAD_ERROR = None
    CANDIDATE_STATUS = []
    
    for path in _candidate_model_paths():
        exists = os.path.exists(path)
        CANDIDATE_STATUS.append((path, exists))
        
        if not exists:
            continue
            
        try:
            MODEL = joblib_load(path)
            if not isinstance(MODEL, dict) or "model" not in MODEL or "vectorizer" not in MODEL:
                raise ValueError("Expected dict with 'model' and 'vectorizer' keys")
            print(f"[app] Loaded model from: {path}")
            return
        except Exception as e:
            LOAD_ERROR = str(e)
            continue
    
    print(f"[app] Model load failed: {LOAD_ERROR}")

_load_model()

# =========================
# Core prediction (natural decision boundary - matches notebook exactly)
# =========================

def predict_usage(text: str) -> Dict:
    """Prediction using natural decision boundary (exactly like notebook)"""
    if MODEL is None:
        raise ValueError("Model not loaded")
    
    # Get components (exactly like notebook)
    vectorizer = MODEL["vectorizer"]
    model = MODEL["model"]
    
    # Transform and predict (exactly like notebook)
    X = vectorizer.transform([text])
    prediction = model.predict(X)[0]  # Natural decision boundary - highest prob wins
    probabilities = model.predict_proba(X)[0]
    
    # Get class names
    classes = list(model.classes_)
    
    # Build response
    probs_dict = {classes[i]: float(probabilities[i]) for i in range(len(classes))}
    top_prob = float(max(probabilities))
    
    return {
        "label": prediction,
        "probs": probs_dict,
        "topProb": top_prob
    }

# =========================
# Web app helpers
# =========================

def _normalize_to_ui_label(cls_name: str) -> str:
    return CLASS_TO_UI.get(cls_name.lower(), cls_name)

def _analyze_review(text: str, place: Optional[str] = None, user: Optional[str] = None,
                   timestamp: Optional[str] = None, rid: int = 1):
    """Analyze review using natural decision boundary (like notebook)"""
    text = (text or "").strip()
    if not text:
        return None, jsonify({"error": "Empty text"}), 400
    
    try:
        # Get prediction using natural decision boundary
        result = predict_usage(text)
        predicted_class = result["label"]  # Winner-takes-all
        model_probs = result["probs"]
        top_prob = result["topProb"]
    except Exception as e:
        return None, jsonify({"error": f"Prediction failed: {e}"}), 500
    
    # Map to UI labels
    probs_ui = {ui: 0.0 for ui in UI_LABELS}
    for model_class, prob in model_probs.items():
        ui_label = _normalize_to_ui_label(model_class)
        if ui_label in probs_ui:
            probs_ui[ui_label] = float(prob)
    
    # Natural decision boundary: flag if predicted class is a violation
    if predicted_class.lower() in VIOLATION_CLASSES:
        predicted_ui_label = _normalize_to_ui_label(predicted_class)
        flags = [predicted_ui_label]
    else:
        flags = []
    
    # Calculate metrics based on probabilities
    violation_probs = {
        "Advertisement": probs_ui.get("Advertisement", 0.0),
        "Irrelevant": probs_ui.get("Irrelevant", 0.0),
        "Rant (no visit)": probs_ui.get("Rant (no visit)", 0.0),
    }
    
    clean_prob = probs_ui.get("Clean Review", 0.0)
    
    # Quality score: if clean review predicted, use that prob; else 1 - max violation prob
    if predicted_class.lower() == "feedback":  # Clean review
        quality_score = round(clean_prob, 2)
    else:
        max_violation_prob = max(violation_probs.values())
        quality_score = round(max(0.0, 1.0 - max_violation_prob), 2)
    
    # Relevancy: 1 - irrelevant probability
    relevancy = round(max(0.0, 1.0 - violation_probs.get("Irrelevant", 0.0)), 2)
    
    # Evidence showing all class probabilities
    evidence = [f"{cls}: {prob:.2f}" for cls, prob in model_probs.items()]
    
    snippet = (text[:120] + "…") if len(text) > 120 else text
    
    result = {
        "id": rid,
        "place": place or "Unknown Place",
        "user": user or "Anonymous",
        "snippet": snippet,
        "fullText": text,
        "timestamp": timestamp or "N/A",
        "relevancy": relevancy,
        "qualityScore": quality_score,
        "prediction_confidence": round(top_prob, 2),
        "flags": flags,  # Based on natural decision boundary
        "evidence": evidence,
        "probs": probs_ui,
        "predicted_class": predicted_class,  # Added for debugging
    }
    
    return result, None, None

def _pick_column(df: pd.DataFrame, *candidates: str) -> Optional[str]:
    lookup = {c.lower(): c for c in df.columns}
    for candidate in candidates:
        if candidate.lower() in lookup:
            return lookup[candidate.lower()]
    return None

# =========================
# Flask app + routes
# =========================

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def _ensure_model_or_500():
    if MODEL is None:
        return jsonify({
            "error": "ML model not loaded. Check MODEL_PATH or place rf_model_pipeline.joblib next to app.py.",
            "checked_paths": [{"path": p, "exists": ex} for p, ex in CANDIDATE_STATUS],
            "last_error": LOAD_ERROR
        }), 500
    return None

@app.get("/api/ping")
def ping():
    err = _ensure_model_or_500()
    if err is not None:
        return err
    
    return jsonify({
        "ok": True,
        "timestamp": int(time.time()),
        "model_loaded": MODEL is not None,
        "decision_method": "natural_boundary"  # No threshold!
    })

@app.get("/api/debug_model")
def debug_model():
    return jsonify({
        "paths_checked": [{"path": p, "exists": ex} for p, ex in CANDIDATE_STATUS],
        "last_error": LOAD_ERROR,
        "current_dir": os.getcwd(),
        "app_dir": os.path.dirname(os.path.abspath(__file__)),
        "model_loaded": MODEL is not None,
        "decision_method": "natural_boundary"
    })

@app.post("/api/predict")
def api_predict_simple():
    """Simple prediction endpoint (notebook-style usage)"""
    err = _ensure_model_or_500()
    if err is not None:
        return err
    
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    
    if not text:
        return jsonify({"error": "Provide non-empty 'text' field"}), 400
    
    try:
        result = predict_usage(text)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.post("/api/analyze_text")
def analyze_text():
    """Analyze single text review (webapp format with natural decision boundary)"""
    err = _ensure_model_or_500()
    if err is not None:
        return err
    
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    place = data.get("place")
    user = data.get("user") 
    timestamp = data.get("timestamp")
    
    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "Provide non-empty 'text' field"}), 400
    
    result, error_response, error_code = _analyze_review(text, place, user, timestamp, 1)
    if error_response is not None:
        return error_response, error_code
    
    return jsonify({"results": [result]})

@app.post("/api/analyze_file")
def analyze_file():
    """Analyze CSV/Excel file with multiple reviews using natural decision boundary"""
    err = _ensure_model_or_500()
    if err is not None:
        return err
    
    if "file" not in request.files:
        return jsonify({"error": "Upload a file under form field 'file'"}), 400
    
    file = request.files["file"]
    content = file.read()
    
    # Get column mappings
    text_column = request.form.get("text_column")
    place_column = request.form.get("place_column") 
    user_column = request.form.get("user_column")
    timestamp_column = request.form.get("timestamp_column")
    
    # Parse file
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception:
        try:
            df = pd.read_excel(io.BytesIO(content))
        except Exception as e:
            return jsonify({"error": f"Failed to parse file: {e}"}), 400
    
    # Auto-detect columns
    text_col = text_column or _pick_column(df, "review", "text", "content", "comment", "body")
    place_col = place_column or _pick_column(df, "place", "location", "business", "venue")
    user_col = user_column or _pick_column(df, "user", "author", "reviewer", "name")
    timestamp_col = timestamp_column or _pick_column(df, "timestamp", "time", "date")
    
    if not text_col:
        for col in df.columns:
            if df[col].dtype == object:
                text_col = col
                break
    
    if not text_col:
        return jsonify({"error": "No suitable text column found"}), 400
    
    # Process reviews
    results = []
    rid = 1
    
    for _, row in df.iterrows():
        text = str(row.get(text_col, "") or "").strip()
        if not text:
            continue
            
        place = str(row.get(place_col, "") or "") if place_col else None
        user = str(row.get(user_col, "") or "") if user_col else None
        timestamp = str(row.get(timestamp_col, "") or "") if timestamp_col else None
        
        result, error_response, error_code = _analyze_review(text, place, user, timestamp, rid)
        if error_response is not None:
            return error_response, error_code
            
        results.append(result)
        rid += 1
    
    return jsonify({"results": results})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)