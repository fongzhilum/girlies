from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import io, re, math, time

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # allow Vite (5173) and others

# -----------------------------
# Heuristics & helpers
# -----------------------------
URL_RE = re.compile(r"(https?://|www\.)\S+", re.IGNORECASE)

PROMO_WORDS = {
    "discount", "promo", "promotion", "sale", "buy now", "free", "voucher", "coupon",
    "offer", "limited time", "deal", "code", "subscribe", "visit", "shop", "click",
}
IRRELEVANT_MARKERS = {
    "placeholder", "testing", "test review",
    "not about this place", "unrelated",
}
NEG_WORDS = {
    "terrible", "awful", "horrible", "worst", "hate", "disgusting", "angry", "bad",
    "poor", "rude", "dirty", "unacceptable", "disappointing", "never", "insulting",
}
POS_WORDS = {
    "amazing", "great", "good", "excellent", "wonderful", "friendly", "clean", "nice",
    "tasty", "delicious", "love", "fast", "helpful",
}
DOMAIN_WORDS = {
    "food", "restaurant", "menu", "service", "staff", "price", "location", "queue",
    "cleanliness", "room", "table", "wait", "ambience", "drink", "bar", "coffee",
    "hotel", "store", "cashier", "counter", "dish", "portion"
}
RANT_NO_VISIT_PATTERNS = [
    r"\bnever been (here|there)\b",
    r"\bhaven't been\b",
    r"\bnot been\b",
    r"\bi heard\b",
    r"\bpeople say\b",
]

def _sentiment_score(text: str) -> float:
    t = text.lower()
    pos = sum(t.count(w) for w in POS_WORDS)
    neg = sum(t.count(w) for w in NEG_WORDS)
    if pos == 0 and neg == 0:
        return 0.0
    return (pos - neg) / max(1, (pos + neg))

def _relevancy_score(text: str, place: str | None) -> float:
    t = text.lower()
    score = 0.0
    if place and place.strip():
        if place.lower().strip() in t:
            score += 0.4
    hits = sum(1 for w in DOMAIN_WORDS if w in t)
    if hits > 0:
        score += min(0.6, math.log(1 + hits) / 2.0)
    return round(max(0.0, min(1.0, score)), 2)

def _advertisement_flags(text: str, ev: list[str], flags: list[str]):
    t = text.lower()
    has_url = bool(URL_RE.search(text))
    has_promo = any(p in t for p in PROMO_WORDS)
    if has_url or has_promo:
        flags.append("Advertisement")
        if has_url: ev.append("Link detected")
        if has_promo: ev.append("Promotional keywords detected")

def _irrelevant_flags(text: str, ev: list[str], flags: list[str]):
    t = text.lower()
    short = len(t.split()) < 8
    has_irrel_marker = any(m in t for m in IRRELEVANT_MARKERS)
    if has_irrel_marker or short:
        flags.append("Irrelevant")
        if has_irrel_marker: ev.append("Irrelevant marker text detected")
        if short: ev.append("Very short review (low information)")

def _rant_no_visit_flags(text: str, ev: list[str], flags: list[str]):
    t = text.lower()
    neg = _sentiment_score(t)
    mentions_no_visit = any(re.search(p, t) for p in RANT_NO_VISIT_PATTERNS)
    very_negative = neg < -0.4
    if mentions_no_visit:
        flags.append("Rant (no visit)")
        ev.append("Mentions having not visited")
    domain_hits = sum(1 for w in DOMAIN_WORDS if w in t)
    if very_negative and domain_hits == 0 and len(t.split()) > 5:
        if "Rant (no visit)" not in flags:
            flags.append("Rant")
        ev.append("Excessive negative sentiment with little detail")

def _quality_score(text: str, flags: list[str]) -> float:
    score = 1.0
    if "Advertisement" in flags: score -= 0.25
    if "Irrelevant" in flags: score -= 0.35
    if "Rant" in flags or "Rant (no visit)" in flags: score -= 0.25
    if len(flags) >= 2: score -= 0.1
    if URL_RE.search(text): score -= 0.15
    return round(max(0.0, min(1.0, score)), 2)

def analyze_one(text: str, place: str | None, user: str | None, timestamp: str | None, rid: int) -> dict:
    text = (text or "").strip()
    place = (place or "Unknown Place").strip()
    user = (user or "Anonymous").strip()
    timestamp = (timestamp or "N/A").strip()

    ev, flags = [], []
    _advertisement_flags(text, ev, flags)
    _irrelevant_flags(text, ev, flags)
    _rant_no_visit_flags(text, ev, flags)

    rel = _relevancy_score(text, place)
    qual = _quality_score(text, flags)
    snippet = (text[:120] + "…") if len(text) > 120 else text

    return {
        "id": rid,
        "place": place,
        "user": user,
        "snippet": snippet,
        "fullText": text,
        "relevancy": rel,
        "qualityScore": qual,
        "flags": flags,
        "timestamp": timestamp,
        "evidence": ev,
    }

def _pick_column(df: pd.DataFrame, *candidates: str) -> str | None:
    lookup = {c.lower(): c for c in df.columns}
    for c in candidates:
        if c in lookup:
            return lookup[c]
    return None

# -----------------------------
# Routes
# -----------------------------
@app.get("/api/ping")
def ping():
    return jsonify({"ok": True, "ts": int(time.time())})

@app.post("/api/analyze_text")
def analyze_text():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    place = data.get("place")
    user = data.get("user")
    ts = data.get("timestamp")
    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "Provide a non-empty 'text' field"}), 400
    res = analyze_one(text, place, user, ts, rid=1)
    return jsonify({"results": [res]})

@app.post("/api/analyze_file")
def analyze_file():
    if "file" not in request.files:
        return jsonify({"error": "Upload a file under form field 'file'"}), 400
    f = request.files["file"]
    content = f.read()

    # Optional column hints
    text_column = request.form.get("text_column")
    place_column = request.form.get("place_column")
    user_column = request.form.get("user_column")
    timestamp_column = request.form.get("timestamp_column")

    # Try CSV then Excel
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception:
        try:
            df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
        except Exception as e:
            return jsonify({"error": f"Failed to parse file as CSV or Excel: {e}"}), 400

    # Auto-detect columns
    text_col = text_column or _pick_column(df, "review", "text", "content", "comments", "comment", "body")
    place_col = place_column or _pick_column(df, "place", "location", "business", "venue", "poi")
    user_col = user_column or _pick_column(df, "user", "author", "reviewer", "name")
    ts_col = timestamp_column or _pick_column(df, "timestamp", "time", "date")

    if not text_col:
        for c in df.columns:
            if df[c].dtype == object:
                text_col = c
                break
    if not text_col:
        return jsonify({"error": "No suitable text column found. Provide 'text_column' in form."}), 400

    results = []
    rid = 1
    for _, row in df.iterrows():
        text = str(row.get(text_col, "") or "")
        if not text.strip():
            continue
        place = str(row.get(place_col, "") or "") if place_col else None
        user = str(row.get(user_col, "") or "") if user_col else None
        ts = str(row.get(ts_col, "") or "") if ts_col else None
        results.append(analyze_one(text, place, user, ts, rid))
        rid += 1

    return jsonify({"results": results})

if __name__ == "__main__":
    # Run on port 8000 to match previous snippets
    app.run(host="0.0.0.0", port=8000, debug=True)
