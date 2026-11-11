"""
Generates a synthetic run-to-failure sensor dataset for a fleet of HPCL-style
refinery assets (pumps, compressors, heat exchangers, tanks, pipelines).

Each asset starts healthy and degrades to end-of-life over a random lifespan,
with sensor readings drifting from healthy baselines toward failure baselines
plus realistic noise. Output columns mirror what the Flask API will serve.

Damage-mechanism layer
-----------------------
Each asset is also assigned one dominant degradation mode, drawn from the
equipment-specific mechanisms cataloged in API RP 571 "Damage Mechanisms
Affecting Fixed Equipment in the Refining Industry" (e.g. cavitation and
erosion-corrosion for pumps, CUI and MIC for tanks, wet H2S damage for
exchangers and piping). The mechanism doesn't change *what* sensors exist,
but it reweights how strongly each sensor is pulled toward its failure
baseline as the asset ages, so different assets of the same type develop
distinct, physically-plausible symptom fingerprints instead of all decaying
identically. The mechanism label and description ride along as metadata
columns (not model features) and are surfaced by the API/UI for context.
"""
import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)

ASSET_TYPES = [
    "Centrifugal Pump",
    "Reciprocating Compressor",
    "Heat Exchanger",
    "Storage Tank",
    "Pipeline Segment",
]

TYPE_PREFIX = {
    "Centrifugal Pump": "PUMP",
    "Reciprocating Compressor": "COMP",
    "Heat Exchanger": "HEX",
    "Storage Tank": "TANK",
    "Pipeline Segment": "PIPE",
}

SENSORS = [
    "vibration_mm_s", "bearing_temp_c", "motor_temp_c",
    "discharge_pressure_bar", "suction_pressure_bar", "flow_rate_m3h",
    "rpm", "lubricant_quality_idx", "power_draw_kw", "noise_db",
    "corrosion_index", "ambient_temp_c", "humidity_pct",
]

# sensor -> (healthy_mean, healthy_std, failure_mean, failure_std)
PROFILES = {
    "Centrifugal Pump": {
        "vibration_mm_s": (1.8, 0.3, 11.0, 1.2),
        "bearing_temp_c": (55, 3, 95, 4),
        "motor_temp_c": (58, 3, 92, 4),
        "discharge_pressure_bar": (12.5, 0.5, 7.5, 0.8),
        "suction_pressure_bar": (3.2, 0.3, 2.4, 0.4),
        "flow_rate_m3h": (150, 6, 95, 8),
        "rpm": (2950, 20, 2820, 60),
        "lubricant_quality_idx": (0.92, 0.03, 0.25, 0.06),
        "power_draw_kw": (72, 4, 105, 6),
        "noise_db": (66, 2, 89, 3),
        "corrosion_index": (0.05, 0.02, 0.55, 0.08),
        "ambient_temp_c": (33, 4, 33, 4),
        "humidity_pct": (55, 10, 55, 10),
    },
    "Reciprocating Compressor": {
        "vibration_mm_s": (3.2, 0.4, 14.5, 1.5),
        "bearing_temp_c": (60, 3, 98, 4),
        "motor_temp_c": (63, 3, 96, 4),
        "discharge_pressure_bar": (28, 1.2, 18, 2),
        "suction_pressure_bar": (4.5, 0.4, 3.2, 0.5),
        "flow_rate_m3h": (95, 5, 55, 6),
        "rpm": (1180, 15, 1080, 40),
        "lubricant_quality_idx": (0.90, 0.03, 0.22, 0.06),
        "power_draw_kw": (140, 8, 190, 10),
        "noise_db": (78, 3, 102, 4),
        "corrosion_index": (0.06, 0.02, 0.58, 0.08),
        "ambient_temp_c": (33, 4, 33, 4),
        "humidity_pct": (55, 10, 55, 10),
    },
    "Heat Exchanger": {
        "vibration_mm_s": (0.4, 0.1, 1.8, 0.3),
        "bearing_temp_c": (50, 3, 60, 4),
        "motor_temp_c": (48, 3, 58, 4),
        "discharge_pressure_bar": (9.5, 0.4, 5.0, 0.8),
        "suction_pressure_bar": (10.5, 0.4, 10.8, 0.5),
        "flow_rate_m3h": (210, 8, 120, 12),
        "rpm": (0, 0.001, 0, 0.001),
        "lubricant_quality_idx": (1.0, 0.001, 1.0, 0.001),
        "power_draw_kw": (18, 2, 30, 3),
        "noise_db": (55, 2, 62, 3),
        "corrosion_index": (0.05, 0.02, 0.62, 0.09),
        "ambient_temp_c": (33, 4, 33, 4),
        "humidity_pct": (55, 10, 55, 10),
    },
    "Storage Tank": {
        "vibration_mm_s": (0.1, 0.05, 0.6, 0.15),
        "bearing_temp_c": (35, 3, 40, 4),
        "motor_temp_c": (33, 3, 38, 4),
        "discharge_pressure_bar": (2.0, 0.2, 1.2, 0.3),
        "suction_pressure_bar": (2.0, 0.2, 2.0, 0.2),
        "flow_rate_m3h": (60, 5, 35, 6),
        "rpm": (0, 0.001, 0, 0.001),
        "lubricant_quality_idx": (1.0, 0.001, 1.0, 0.001),
        "power_draw_kw": (5, 1, 8, 1.5),
        "noise_db": (40, 2, 46, 3),
        "corrosion_index": (0.08, 0.03, 0.75, 0.10),
        "ambient_temp_c": (33, 4, 33, 4),
        "humidity_pct": (55, 10, 65, 12),
    },
    "Pipeline Segment": {
        "vibration_mm_s": (0.3, 0.1, 1.5, 0.3),
        "bearing_temp_c": (34, 3, 40, 4),
        "motor_temp_c": (32, 3, 38, 4),
        "discharge_pressure_bar": (18, 1, 9, 1.5),
        "suction_pressure_bar": (19, 1, 19, 1),
        "flow_rate_m3h": (300, 15, 170, 20),
        "rpm": (0, 0.001, 0, 0.001),
        "lubricant_quality_idx": (1.0, 0.001, 1.0, 0.001),
        "power_draw_kw": (2, 0.5, 4, 1),
        "noise_db": (45, 2, 55, 3),
        "corrosion_index": (0.06, 0.02, 0.68, 0.09),
        "ambient_temp_c": (33, 4, 33, 4),
        "humidity_pct": (55, 10, 55, 10),
    },
}

# Dominant damage mechanisms per asset type, drawn from API RP 571.
# "emphasis" reweights how fast each sensor moves toward its failure
# baseline (1.0 = the type's default pace; >1 = earlier/stronger signal,
# <1 = suppressed/lagging signal). Sensors not listed use 1.0.
MECHANISMS = {
    "Centrifugal Pump": [
        {
            "name": "Cavitation",
            "api571_ref": "API 571 §4.2.15",
            "description": (
                "Vapor bubbles collapsing at the impeller under insufficient "
                "suction head erode the metal surface, producing sharp-edged "
                "pitting. Shows up first as rising vibration and noise with "
                "an unstable suction pressure."
            ),
            "emphasis": {
                "vibration_mm_s": 1.7, "noise_db": 1.6,
                "suction_pressure_bar": 1.5, "lubricant_quality_idx": 0.6,
            },
        },
        {
            "name": "Erosion-Corrosion",
            "api571_ref": "API 571 §4.2.14",
            "description": (
                "Entrained solids or high-velocity flow strip the protective "
                "oxide film from wetted metal surfaces, accelerating "
                "localized corrosion at bends, seals, and impeller vanes."
            ),
            "emphasis": {
                "corrosion_index": 1.6, "flow_rate_m3h": 1.4,
                "discharge_pressure_bar": 1.2, "vibration_mm_s": 0.7,
            },
        },
        {
            "name": "Mechanical Fatigue (Bearing/Seal)",
            "api571_ref": "API 571 §4.2.16",
            "description": (
                "Cyclic stress at the shaft, bearings, and mechanical seal "
                "accumulates fatigue damage, raising bearing temperature and "
                "lubricant contamination well ahead of end of life."
            ),
            "emphasis": {
                "bearing_temp_c": 1.6, "lubricant_quality_idx": 1.5,
                "vibration_mm_s": 1.3, "power_draw_kw": 1.2,
            },
        },
    ],
    "Reciprocating Compressor": [
        {
            "name": "Vibration-Induced Fatigue",
            "api571_ref": "API 571 §4.2.17",
            "description": (
                "Cyclic loading from piston/valve reversal at resonant "
                "frequencies fatigues small-bore connections and mountings, "
                "producing an early, sustained rise in vibration and noise."
            ),
            "emphasis": {
                "vibration_mm_s": 1.7, "noise_db": 1.4, "rpm": 1.3,
            },
        },
        {
            "name": "Valve & Piston Wear (Mechanical Fatigue)",
            "api571_ref": "API 571 §4.2.16",
            "description": (
                "Repeated impact loading on suction/discharge valves and "
                "piston rings degrades sealing efficiency, driving up power "
                "draw and lubricant contamination while discharge pressure "
                "sags."
            ),
            "emphasis": {
                "power_draw_kw": 1.5, "discharge_pressure_bar": 1.4,
                "lubricant_quality_idx": 1.3,
            },
        },
        {
            "name": "Sulfidation / High-Temp H2/H2S Corrosion",
            "api571_ref": "API 571 §4.4.2 / §5.1.1.5",
            "description": (
                "Sulfur compounds in the gas stream react with the metal "
                "surface at elevated temperature, wasting wall thickness "
                "and pushing up bearing/casing temperatures ahead of "
                "mechanical symptoms."
            ),
            "emphasis": {
                "corrosion_index": 1.7, "bearing_temp_c": 1.3,
                "motor_temp_c": 1.3,
            },
        },
    ],
    "Heat Exchanger": [
        {
            "name": "Erosion-Corrosion (Tube-Side)",
            "api571_ref": "API 571 §4.2.14",
            "description": (
                "High-velocity or particle-laden process fluid strips "
                "protective scale from tube walls, thinning tubes fastest "
                "near inlets and causing a throughput/pressure-drop "
                "signature."
            ),
            "emphasis": {
                "corrosion_index": 1.5, "flow_rate_m3h": 1.4,
                "discharge_pressure_bar": 1.3,
            },
        },
        {
            "name": "Wet H2S Damage (HIC/SOHIC)",
            "api571_ref": "API 571 §5.1.2.3",
            "description": (
                "Atomic hydrogen from sulfide corrosion collects at steel "
                "inclusions, blistering and stepwise-cracking the shell; "
                "often has little visible sign until wall integrity is "
                "already compromised."
            ),
            "emphasis": {
                "corrosion_index": 1.6, "vibration_mm_s": 1.3,
                "noise_db": 1.2,
            },
        },
        {
            "name": "Chloride Stress Corrosion Cracking",
            "api571_ref": "API 571 §4.5.1",
            "description": (
                "Chlorides concentrating in warm cooling water crack "
                "susceptible stainless surfaces under tensile stress, "
                "typically at welds and warmer zones of the bundle."
            ),
            "emphasis": {
                "corrosion_index": 1.4, "motor_temp_c": 1.3,
                "bearing_temp_c": 1.2,
            },
        },
    ],
    "Storage Tank": [
        {
            "name": "Soil / Bottom-Plate Corrosion",
            "api571_ref": "API 571 §4.3.9",
            "description": (
                "Moisture and dissolved electrolytes beneath the tank floor "
                "drive localized external corrosion of the bottom plate, "
                "often invisible from inside the tank until it perforates."
            ),
            "emphasis": {"corrosion_index": 1.7, "flow_rate_m3h": 0.8},
        },
        {
            "name": "Corrosion Under Insulation (CUI)",
            "api571_ref": "API 571 §4.3.3",
            "description": (
                "Water trapped under insulation or fireproofing corrodes "
                "the shell out of sight; risk climbs sharply with ambient "
                "humidity and temperature cycling."
            ),
            "emphasis": {
                "corrosion_index": 1.5, "humidity_pct": 1.4,
                "ambient_temp_c": 1.2,
            },
        },
        {
            "name": "Microbiologically Induced Corrosion (MIC)",
            "api571_ref": "API 571 §4.3.8",
            "description": (
                "Bacteria in stagnant bottom water produce localized, "
                "cup-shaped pitting under tubercles, accelerating "
                "corrosion far faster than uniform wastage would predict."
            ),
            "emphasis": {
                "corrosion_index": 1.6, "humidity_pct": 1.3,
                "discharge_pressure_bar": 1.1,
            },
        },
    ],
    "Pipeline Segment": [
        {
            "name": "Erosion-Corrosion",
            "api571_ref": "API 571 §4.2.14",
            "description": (
                "High velocity, turbulence, or entrained solids strip the "
                "protective film at bends and reducers, thinning the pipe "
                "wall fastest at points of flow disturbance."
            ),
            "emphasis": {
                "corrosion_index": 1.5, "flow_rate_m3h": 1.5,
                "discharge_pressure_bar": 1.3,
            },
        },
        {
            "name": "External / Under-Insulation Corrosion",
            "api571_ref": "API 571 §4.3.2 / §4.3.3",
            "description": (
                "Atmospheric moisture, or moisture trapped under "
                "insulation, corrodes the pipe from the outside in — "
                "strongly correlated with humidity and thermal cycling."
            ),
            "emphasis": {
                "corrosion_index": 1.5, "humidity_pct": 1.4,
                "ambient_temp_c": 1.2,
            },
        },
        {
            "name": "Wet H2S Cracking (Sulfide Stress Cracking)",
            "api571_ref": "API 571 §5.1.2.3",
            "description": (
                "Hydrogen generated by sulfide corrosion embrittles hard "
                "weld/HAZ zones under residual stress, risking sudden "
                "cracking with little prior corrosion-rate warning."
            ),
            "emphasis": {
                "corrosion_index": 1.6, "vibration_mm_s": 1.2,
                "noise_db": 1.2,
            },
        },
    ],
}

BASE_LIFE = 200  # cap for RUL target (days)
ASSETS_PER_TYPE = 10
MIN_LIFE, MAX_LIFE = 120, 320


def simulate_asset(asset_id, asset_type, asset_type_code, life_length, mechanism):
    profile = PROFILES[asset_type]
    emphasis = mechanism["emphasis"]
    cycles = np.arange(life_length + 1)
    frac = cycles / life_length
    health_frac = np.clip(1 - frac ** 1.5, 0, 1)
    base_progress = 1 - health_frac

    rows = {"asset_id": asset_id, "asset_type": asset_type,
            "asset_type_code": asset_type_code, "cycle": cycles,
            "damage_mechanism": mechanism["name"],
            "api571_ref": mechanism["api571_ref"],
            "mechanism_description": mechanism["description"]}

    for sensor in SENSORS:
        h_mean, h_std, f_mean, f_std = profile[sensor]
        weight = emphasis.get(sensor, 1.0)
        progress = np.clip(base_progress * weight, 0, 1)
        interp_mean = h_mean + (f_mean - h_mean) * progress
        interp_std = h_std + (f_std - h_std) * progress
        noise = RNG.normal(0, 1, size=len(cycles)) * interp_std
        values = interp_mean + noise
        if sensor in ("rpm", "corrosion_index", "lubricant_quality_idx"):
            values = np.clip(values, 0, None)
        rows[sensor] = values

    rul = life_length - cycles
    rows["RUL"] = np.minimum(rul, BASE_LIFE)
    rows["health_score"] = np.clip(np.round(health_frac * 100), 0, 100).astype(int)
    return pd.DataFrame(rows)


def main():
    frames = []
    for type_idx, asset_type in enumerate(ASSET_TYPES):
        prefix = TYPE_PREFIX[asset_type]
        mechanisms = MECHANISMS[asset_type]
        for i in range(1, ASSETS_PER_TYPE + 1):
            asset_id = f"{prefix}-{i:03d}"
            life_length = int(RNG.integers(MIN_LIFE, MAX_LIFE + 1))
            mechanism = mechanisms[(i - 1) % len(mechanisms)]
            frames.append(simulate_asset(asset_id, asset_type, type_idx, life_length, mechanism))

    df = pd.concat(frames, ignore_index=True)
    df = df.sort_values(["asset_type", "asset_id", "cycle"]).reset_index(drop=True)

    out_path = "hpcl_assets.csv"
    df.to_csv(out_path, index=False)
    print(f"Wrote {len(df)} rows across {df['asset_id'].nunique()} assets to {out_path}")
    print(df.groupby("asset_type")["asset_id"].nunique())
    print(df.groupby(["asset_type", "damage_mechanism"])["asset_id"].nunique())
    print(df[["RUL", "health_score"]].describe())


if __name__ == "__main__":
    main()
