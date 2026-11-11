# HPCL Asset Health Prediction System

An AI-driven predictive maintenance dashboard for refinery-style industrial
assets — centrifugal pumps, reciprocating compressors, heat exchangers,
storage tanks, and pipeline segments. It ingests sensor telemetry, predicts
each asset's **Remaining Useful Life (RUL)** and a 0-100 **Health Score**
using a trained XGBoost model, and surfaces fleet-wide status (Healthy /
Watch / Critical) with alerting for assets that need urgent attention.

This is a demo/portfolio project built around a **synthetic** sensor dataset
generated to resemble refinery-asset degradation patterns — it is not
affiliated with, endorsed by, or built on real data from Hindustan Petroleum
Corporation Limited (HPCL). The name is used as a domain framing exercise.

## Architecture

Three services run independently:

| Service | Stack | Port | Responsibility |
|---|---|---|---|
| ML backend | Flask + XGBoost + pandas | 5000 | Serves live sensor readings, RUL/health-score predictions (`/predict`), and the fleet overview (`/assets`) |
| Auth/API backend | Node.js + Express + MongoDB (Mongoose) | 8000 | User registration/login (JWT), feedback, maintenance reminders |
| Frontend | React + Tailwind + Chart.js | 3000 | Dashboard UI — fleet overview, live asset monitor, reports, calendar, profile |

## Data & Model

- `ml/generate_hpcl_assets.py` — simulates run-to-failure sensor histories
  for 50 assets (10 each of 5 asset types), writing `hpcl_assets.csv`. Each
  asset degrades from a healthy baseline to a failure baseline over a random
  lifespan, with realistic per-sensor noise.
- `ml/train_model.py` — trains an `XGBRegressor` to predict RUL (capped at
  200 days) from 13 sensor features + asset type, saves `hpcl_asset_model.pkl`,
  and regenerates the report plots under `frontend/src/images/`.
- Re-run both scripts from the project root (`python ml/generate_hpcl_assets.py
  && python ml/train_model.py`) to regenerate the dataset/model with a
  different seed or profile.

### Damage-mechanism layer (API RP 571)

Each simulated asset is also assigned a dominant degradation mode drawn from
the equipment-specific damage mechanisms cataloged in **API Recommended
Practice 571** *"Damage Mechanisms Affecting Fixed Equipment in the Refining
Industry"* — e.g. cavitation and erosion-corrosion for pumps, wet H2S
damage for heat exchangers, soil corrosion and MIC for storage tanks. The
mechanism doesn't add new sensors; it reweights how strongly each existing
sensor is pulled toward its failure value as the asset ages, so two assets
of the same type develop distinct, physically-plausible symptom fingerprints
instead of decaying identically (see the `MECHANISMS` dict in
`ml/generate_hpcl_assets.py`). It is metadata only — excluded from the
model's training features — and is surfaced by the API (`damage_mechanism`,
`api571_ref`, `mechanism_description`) and the dashboard for context on
*why* an asset might be degrading, not just *that* it is. Descriptions are
original paraphrases of publicly documented failure-mode categories, not
reproductions of API 571's copyrighted text.

## Running it

```bash
# ML backend
pip install flask flask-cors xgboost pandas requests
python app.py                      # http://localhost:5000

# Auth backend (needs a MongoDB connection string in backend/.env as DB_URL=...)
cd backend && npm install
node index.js                      # http://localhost:8000

# Frontend
cd frontend && npm install
npm start                          # http://localhost:3000
```

## API contract (ML backend)

- `GET/POST /predict` — advances a live-feed pointer and returns the current
  asset's sensor readings plus `health_score`, `rul`, `status`
  (`Healthy`/`Watch`/`Critical`), an `alert`/`message` when critical, and
  `damage_mechanism` / `api571_ref` / `mechanism_description`.
- `GET/POST /getsensor` — raw sensor snapshot only, no prediction.
- `GET /assets` — fleet overview: one row per asset with its current
  `health_score`, `rul`, `status`, `damage_mechanism`, and `api571_ref`.
