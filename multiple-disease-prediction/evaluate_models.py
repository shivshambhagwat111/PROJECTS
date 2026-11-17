"""Extra evaluation for the three models (the training notebooks report a single split with accuracy only).

Reports, per condition: test accuracy on the notebook split, recall and precision for the positive class,
the majority-class baseline, 5-fold cross-validated accuracy, and for Parkinson's a subject-grouped
5-fold accuracy (the dataset holds several recordings per person, so a random split can leak speakers).

Run: python evaluate_models.py
"""
import warnings

import pandas as pd
from sklearn import svm
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.model_selection import GroupKFold, StratifiedKFold, cross_val_score, train_test_split

warnings.filterwarnings("ignore")

diabetes = pd.read_csv("dataset/diabetes.csv")
heart = pd.read_csv("dataset/heart.csv")
parkinsons = pd.read_csv("dataset/parkinsons.csv")

# name -> (features, label, model, stratified split as in the notebook)
SETS = {
    "Diabetes (linear SVM)": (diabetes.drop(columns="Outcome"), diabetes["Outcome"], svm.SVC(kernel="linear"), True),
    "Heart disease (logistic regression)": (heart.drop(columns="target"), heart["target"], LogisticRegression(), True),
    "Parkinson's (linear SVM)": (parkinsons.drop(columns=["name", "status"]), parkinsons["status"], svm.SVC(kernel="linear"), False),
}

for name, (X, y, model, stratify) in SETS.items():
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y if stratify else None, random_state=2
    )
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    cv = cross_val_score(model, X, y, cv=StratifiedKFold(5, shuffle=True, random_state=2))
    print(name)
    print(f"  records {len(X)} | majority-class baseline {max(y.mean(), 1 - y.mean()):.3f}")
    print(f"  test accuracy {accuracy_score(y_test, pred):.3f} | recall {recall_score(y_test, pred):.3f} | precision {precision_score(y_test, pred):.3f}")
    print(f"  5-fold CV accuracy {cv.mean():.3f} +/- {cv.std():.3f}")

# Parkinson's: group recordings by subject ("phon_R01_S01_1" -> "S01") so no person is in both train and test.
X, y = SETS["Parkinson's (linear SVM)"][:2]
subjects = parkinsons["name"].str.extract(r"(S\d+)")[0]
grouped = cross_val_score(svm.SVC(kernel="linear"), X, y, cv=GroupKFold(5), groups=subjects)
print(f"Parkinson's subject-grouped 5-fold accuracy {grouped.mean():.3f} ({subjects.nunique()} subjects; folds {', '.join(f'{s:.2f}' for s in grouped)})")
