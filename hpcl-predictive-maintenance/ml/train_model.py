"""
Trains an XGBoost regressor to predict Remaining Useful Life (RUL, capped at
200 days) for HPCL refinery assets from sensor readings, and regenerates the
report plots consumed by frontend/src/components/Reports.js.
"""
import pickle

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import GroupShuffleSplit

SENSORS = [
    "vibration_mm_s", "bearing_temp_c", "motor_temp_c",
    "discharge_pressure_bar", "suction_pressure_bar", "flow_rate_m3h",
    "rpm", "lubricant_quality_idx", "power_draw_kw", "noise_db",
    "corrosion_index", "ambient_temp_c", "humidity_pct",
]
FEATURES = SENSORS + ["asset_type_code"]
IMG_DIR = "frontend/src/images"


def main():
    df = pd.read_csv("hpcl_assets.csv")

    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(splitter.split(df, groups=df["asset_id"]))
    train_df, test_df = df.iloc[train_idx], df.iloc[test_idx]

    X_train, y_train = train_df[FEATURES], train_df["RUL"]
    X_test, y_test = test_df[FEATURES], test_df["RUL"]

    model = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    print(f"Test MAE: {mae:.2f} days | R2: {r2:.3f}")

    with open("hpcl_asset_model.pkl", "wb") as f:
        pickle.dump(model, f)
    print("Saved model to hpcl_asset_model.pkl")

    sns.set_theme(style="whitegrid")

    # 1. Correlation heatmap (top5.png - used as "Correlation heatmap" in Reports.js)
    corr = df[SENSORS + ["RUL"]].corr()
    plt.figure(figsize=(9, 7))
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0, vmin=-1, vmax=1)
    plt.title("HPCL Asset Sensor Correlation Heatmap")
    plt.tight_layout()
    plt.savefig(f"{IMG_DIR}/top5.png", dpi=110)
    plt.savefig(f"{IMG_DIR}/correlation_heatmap.png", dpi=110)
    plt.close()

    # 2. Feature importance (weight) -> feature_weights_plot.png
    importances = pd.Series(model.feature_importances_, index=FEATURES).sort_values()
    plt.figure(figsize=(8, 6))
    importances.plot(kind="barh", color="#F7941D")
    plt.title("Effect of Sensor Features on Asset Health / RUL")
    plt.xlabel("Importance (gain)")
    plt.tight_layout()
    plt.savefig(f"{IMG_DIR}/feature_weights_plot.png", dpi=110)
    plt.close()

    # 3. Native XGBoost importance plot -> xgb_importance_plot.png
    plt.figure(figsize=(8, 6))
    xgb.plot_importance(model, max_num_features=len(FEATURES), color="#003DA5", grid=False)
    plt.title("XGBoost Feature Importance - Failure Prediction")
    plt.tight_layout()
    plt.savefig(f"{IMG_DIR}/xgb_importance_plot.png", dpi=110)
    plt.close()

    # 4. Box plot of standardized sensor distributions -> box_plot.png
    standardized = (df[SENSORS] - df[SENSORS].mean()) / df[SENSORS].std().replace(0, 1)
    plt.figure(figsize=(11, 6))
    sns.boxplot(data=standardized, orient="h", color="#F7941D")
    plt.title("Sensor Value Distribution Across HPCL Asset Fleet (standardized)")
    plt.tight_layout()
    plt.savefig(f"{IMG_DIR}/box_plot.png", dpi=110)
    plt.close()

    # 5. Actual vs predicted RUL scatter -> actual_vs_predicted.png
    plt.figure(figsize=(7, 7))
    plt.scatter(y_test, y_pred, alpha=0.3, s=12, color="#003DA5")
    lims = [0, max(y_test.max(), y_pred.max()) + 5]
    plt.plot(lims, lims, "--", color="#F7941D", linewidth=2)
    plt.xlabel("Actual RUL (days)")
    plt.ylabel("Predicted RUL (days)")
    plt.title(f"Actual vs Predicted RUL (MAE={mae:.1f}d, R2={r2:.2f})")
    plt.tight_layout()
    plt.savefig(f"{IMG_DIR}/actual_vs_predicted.png", dpi=110)
    plt.close()

    print("Regenerated report plots in", IMG_DIR)


if __name__ == "__main__":
    main()
