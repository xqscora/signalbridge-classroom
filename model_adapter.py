"""Optional local bridge to the trained Heard speech model.

The public Pages demo uses a small browser-native model so it works without
downloads. This adapter is the real wav2vec2 + LogisticRegression path from
the USAII project, followed by SignalBridge's support-state and abstention
layer. It never sends audio over the network.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import librosa
import numpy as np
import torch

HERE = Path(__file__).resolve().parent
MODEL_PATH = HERE / "models" / "ravdess_w2v_ser_model.joblib"
BACKBONE = "superb/wav2vec2-base-superb-er"
_CACHE = {}


def load_model():
    if _CACHE:
        return _CACHE
    from transformers import AutoFeatureExtractor, AutoModel

    bundle = joblib.load(MODEL_PATH)
    _CACHE.update(
        model=bundle["model"],
        scaler=bundle["scaler"],
        emotions=bundle["emotions"],
        extractor=AutoFeatureExtractor.from_pretrained(BACKBONE),
        backbone=AutoModel.from_pretrained(BACKBONE).eval(),
    )
    return _CACHE


def predict_emotion(audio_path: str | Path) -> dict:
    """Run the original trained model on one local audio file."""
    c = load_model()
    speech, _ = librosa.load(str(audio_path), sr=16000, duration=3.0, offset=0.5)
    inputs = c["extractor"](speech, sampling_rate=16000, return_tensors="pt")
    with torch.no_grad():
        embedding = c["backbone"](**inputs).last_hidden_state.mean(dim=1).numpy()
    probabilities = c["model"].predict_proba(c["scaler"].transform(embedding))[0]
    emotions = {
        c["emotions"][int(class_index)]: round(float(probability), 4)
        for class_index, probability in zip(c["model"].classes_, probabilities)
    }
    confidence = float(max(probabilities))
    return {"emotion_confidence": round(confidence, 4), "emotion_probabilities": emotions}


def to_support_signal(result: dict) -> dict:
    """Convert the research prior into a non-diagnostic support suggestion."""
    probs = result["emotion_probabilities"]
    scores = {
        "ready": 0.45 * probs.get("calm", 0) + 0.4 * probs.get("happy", 0) + 0.15 * probs.get("neutral", 0),
        "pause": 0.4 * probs.get("sad", 0) + 0.3 * probs.get("angry", 0) + 0.2 * probs.get("fearful", 0) + 0.1 * probs.get("disgust", 0),
        "ask": 0.6 * probs.get("surprised", 0) + 0.4 * probs.get("neutral", 0),
    }
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    top_label, top_score = ranked[0]
    margin = top_score - ranked[1][1]
    abstained = result["emotion_confidence"] < 0.4 or margin < 0.1
    return {
        **result,
        "support_state": "ask" if abstained else top_label,
        "support_scores": {key: round(float(value), 4) for key, value in scores.items()},
        "abstained": abstained,
        "reason": "low evidence or close support-state tie" if abstained else "research prior passed to learner-specific layer",
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: python model_adapter.py path/to/audio.wav")
    print(json.dumps(to_support_signal(predict_emotion(sys.argv[1])), indent=2))
