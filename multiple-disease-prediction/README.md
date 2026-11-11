# Multiple Disease Prediction (Streamlit)

A Streamlit app that predicts diabetes, heart disease and Parkinson's disease from clinical inputs, with one page per condition.

## Models
| Condition | Model | Records | Test accuracy (single 80/20 split) |
|---|---|---|---|
| Diabetes | Linear SVM | 768 | 77.3% |
| Heart disease | Logistic Regression | 303 | 82.0% |
| Parkinson's | Linear SVM | 195 | 87.2% |

Training notebooks are in `colab_files_to_train_models/`, datasets in `dataset/`, saved models in `saved_models/`.

## Run
```bash
pip install -r requirements.txt
streamlit run app.py
```

## Notes and limitations
- Educational demo, not a medical diagnosis tool.
- Evaluated on a single random split with accuracy only; no cross-validation, recall or precision.
- The Parkinson's dataset contains several recordings per person, so a random split can leak speakers across train and test and overstate accuracy. A subject-grouped split is the honest evaluation.
- The app validates that every field is a number and shows an error otherwise.
