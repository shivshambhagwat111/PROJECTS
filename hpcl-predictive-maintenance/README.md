# HPCL Asset Health Prediction System

An AI-driven predictive maintenance dashboard for refinery-style industrial
assets — centrifugal pumps, reciprocating compressors, heat exchangers,
storage tanks, and pipeline segments. It ingests sensor telemetry, predicts
each asset's **Remaining Useful Life (RUL)** and a 0-100 **Health Score**
using a trained XGBoost model, and surfaces fleet-wide status (Healthy /
Watch / Critical) with alerting for assets that need urgent attention.

This project was built during my Product Analytics internship at HPCL
(May - July 2025), where the model and pipeline were developed and evaluated
on real HPCL asset data. That data is confidential and cannot be published, so
this public repository uses a **synthetic** dataset with the same schema,
generated to resemble refinery-asset degradation patterns. The code, model
and dashboard are the same; the numbers produced from the synthetic data
(including R², MAE and maintenance-check changes) will differ from those
reported on the real data. This repo is not an official HPCL release and is
not endorsed by Hindustan Petroleum Corporation Limited.

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

## Impact: risk-based vs fixed inspection (simulated policy comparison)

Maintenance today runs on fixed schedules, so healthy assets are over-checked
and degrading ones can be missed. To size the benefit of using the health score
to drive inspection frequency, two policies were compared on the same 50 asset
histories (11,207 asset-days):

- **Baseline (fixed):** every asset inspected every 30 days, regardless of condition.
- **Risk-based:** inspection interval set by health status: Healthy every 90
  days, Watch every 30 days, Critical every 3 days.

Checks per status over the assets' lifetimes (synthetic dataset in this repo):

| Status | Fixed checks | Risk-based checks | Change |
|---|---|---|---|
| Healthy | 169 | 56 | -67% |
| Watch | 97 | 97 | 0% |
| Critical | 107 | 1,068 | +9x (about 10x) |

On the real HPCL data the same comparison gave about 65% fewer checks on
healthy units and about 10x more on critical units. Total checks rise
(374 to 1,222) because the extra effort is concentrated on Critical assets:
the aim is to match inspection effort to risk, not to cut the total.

**Limitations:** this is a policy simulation, not a measured field result. The
intervals are assumptions, and the percentages change if they change. It does
not model inspection cost, or failures avoided or missed.

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
