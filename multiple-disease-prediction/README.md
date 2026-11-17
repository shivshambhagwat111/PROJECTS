# Multiple Disease Prediction (Streamlit)

A Streamlit app that predicts diabetes, heart disease and Parkinson's disease from clinical inputs, with one page per condition.

## Models
| Condition | Model | Records | Test accuracy (single 80/20 split) |
|---|---|---|---|
| Diabetes | Linear SVM | 768 | 77.3% |
| Heart disease | Logistic Regression | 303 | 82.0% |
| Parkinson's | Linear SVM | 195 | 87.2% |

Training notebooks are in `colab_files_to_train_models/`, datasets in `dataset/`, saved models in `saved_models/`.

## Further evaluation (`python evaluate_models.py`)
| Condition | Majority-class baseline | Recall (positive class) | 5-fold CV accuracy |
|---|---|---|---|
| Diabetes | 65.1% | 51.9% | 77.5% |
| Heart disease | 54.5% | 81.8% | 82.5% |
| Parkinson's | 75.4% | 96.8% | 85.6% (random folds), 80.8% (grouped by subject) |

- The diabetes model misses about half of true diabetic cases in the test split, so it is a poor screening tool despite 77.3% accuracy.
- For Parkinson's, the subject-grouped estimate (about 81%, folds from 62% to 100%) is the fairer figure than the 87.2% single-split score, and it sits close to the 75.4% majority-class baseline.

## Run
```bash
pip install -r requirements.txt
streamlit run app.py
```

## Notes and limitations
- Educational demo, not a medical diagnosis tool.
- The headline accuracies above come from a single random split; see "Further evaluation" for recall, baselines and cross-validation.
- The app returns a yes/no model prediction, not a probability or risk score, and the Parkinson's page needs 22 voice-signal measurements that a lay user cannot supply.
- The Parkinson's dataset contains several recordings per person, so a random split can leak speakers across train and test and overstate accuracy. A subject-grouped split is the honest evaluation.
- The app validates that every field is a number and shows an error otherwise.
