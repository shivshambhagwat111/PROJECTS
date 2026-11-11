from datetime import datetime, timedelta

from flask import Flask, jsonify
import pickle
import pandas as pd
import requests

from flask_cors import CORS

app = Flask(__name__)
CORS(app, support_credentials=True)

SENSORS = [
    "vibration_mm_s", "bearing_temp_c", "motor_temp_c",
    "discharge_pressure_bar", "suction_pressure_bar", "flow_rate_m3h",
    "rpm", "lubricant_quality_idx", "power_draw_kw", "noise_db",
    "corrosion_index", "ambient_temp_c", "humidity_pct",
]
FEATURES = SENSORS + ["asset_type_code"]
BASE_LIFE = 200  # days, matches the cap used when training the model

samples = pd.read_csv("./hpcl_assets.csv")

with open("hpcl_asset_model.pkl", "rb") as file:
    model = pickle.load(file)

# A snapshot of "where each asset happens to be today", used by /assets for
# the fleet overview. Sampling a random cycle per asset (instead of always
# the last row) avoids every asset showing up at its end-of-life state.
latest_by_asset = pd.concat(
    [group.sample(n=1, random_state=42 + i) for i, (_, group) in enumerate(samples.groupby("asset_id"))],
    ignore_index=True,
)


def telegram_notifier(message="Maintenance needed"):
    TOKEN = ""
    CHAT_ID = ""
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage?chat_id={CHAT_ID}&text={message}"
    requests.post(url)


def status_for(health_score):
    if health_score >= 70:
        return "Healthy"
    if health_score >= 40:
        return "Watch"
    return "Critical"


# Fixed cadence every asset would be inspected at under a "walk the whole
# fleet on the same calendar" policy, regardless of condition. Used only as
# the comparison baseline for the risk-based schedule below.
BASELINE_INTERVAL_DAYS = 30


def recommended_interval_days(status, rul):
    """Risk-based inspection interval: shrink it for assets that are
    actually degrading, stretch it for healthy ones (bounded so a fast-RUL
    healthy asset still isn't left unchecked for too long). This is what
    lets the fleet-wide inspection count come in under the fixed baseline
    instead of every asset being walked on the same fixed calendar."""
    if status == "Critical":
        return 3
    if status == "Watch":
        return max(7, min(21, rul // 3 or 1))
    return max(30, min(90, rul // 2 or 1))


def inspection_plan_for(row):
    rul, health_score, status = predict_row(row)
    interval = recommended_interval_days(status, rul)
    next_due = (datetime.utcnow() + timedelta(days=interval)).date().isoformat()
    severity_rank = {"Critical": 0, "Watch": 1, "Healthy": 2}[status]
    return {
        'asset_id': row['asset_id'],
        'asset_type': row['asset_type'],
        'status': status,
        'health_score': health_score,
        'rul': rul,
        'recommended_interval_days': interval,
        'next_inspection_date': next_due,
        'damage_mechanism': row['damage_mechanism'],
        'api571_ref': row['api571_ref'],
        '_severity_rank': severity_rank,
    }


def predict_row(row):
    features = pd.DataFrame([row[FEATURES].to_dict()])
    pred_rul = float(model.predict(features)[0])
    rul = max(0, round(pred_rul))
    health_score = max(0, min(100, round(100 * rul / BASE_LIFE)))
    status = status_for(health_score)
    return rul, health_score, status


@app.route('/predict', methods=['GET', 'POST'])
def calculate():
    global time
    try:
        time = (time + 1) % len(samples)
        row = samples.iloc[time]

        rul, health_score, status = predict_row(row)
        alert = status == "Critical"
        message = (
            f"HPCL Alert: {row['asset_id']} ({row['asset_type']}) health score "
            f"{health_score}% - schedule urgent maintenance"
            if alert else None
        )
        if alert:
            telegram_notifier(message)

        return jsonify({
            'asset_id': row['asset_id'],
            'asset_type': row['asset_type'],
            'health_score': health_score,
            'rul': rul,
            's_data': {s: float(row[s]) for s in SENSORS},
            'time': int(time),
            'status': status,
            'alert': alert,
            'message': message,
            'damage_mechanism': row['damage_mechanism'],
            'api571_ref': row['api571_ref'],
            'mechanism_description': row['mechanism_description'],
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/getsensor', methods=['GET', 'POST'])
def get_sensor_data():
    global time
    time = (time + 1) % len(samples)
    row = samples.iloc[time]
    return jsonify({
        'asset_id': row['asset_id'],
        'asset_type': row['asset_type'],
        's_data': {s: float(row[s]) for s in SENSORS},
        'time': int(time),
    }), 200


@app.route('/assets', methods=['GET'])
def list_assets():
    assets = []
    for _, row in latest_by_asset.iterrows():
        rul, health_score, status = predict_row(row)
        assets.append({
            'asset_id': row['asset_id'],
            'asset_type': row['asset_type'],
            'health_score': health_score,
            'rul': rul,
            'status': status,
            'damage_mechanism': row['damage_mechanism'],
            'api571_ref': row['api571_ref'],
        })
    return jsonify({'assets': assets}), 200


@app.route('/inspection-plan', methods=['GET'])
def inspection_plan():
    plan = [inspection_plan_for(row) for _, row in latest_by_asset.iterrows()]
    plan.sort(key=lambda a: (a['_severity_rank'], a['rul']))
    for a in plan:
        del a['_severity_rank']

    num_assets = len(plan)
    baseline_per_year = round(num_assets * 365 / BASELINE_INTERVAL_DAYS, 1)
    optimized_per_year = round(sum(365 / a['recommended_interval_days'] for a in plan), 1)
    pct_reduction = round(
        100 * (baseline_per_year - optimized_per_year) / baseline_per_year, 1
    ) if baseline_per_year else 0

    return jsonify({
        'plan': plan,
        'summary': {
            'baseline_interval_days': BASELINE_INTERVAL_DAYS,
            'baseline_inspections_per_year': baseline_per_year,
            'optimized_inspections_per_year': optimized_per_year,
            'pct_reduction': pct_reduction,
        },
    }), 200


if __name__ == '__main__':
    time = 0
    app.run(debug=True)
