import os
import pickle
import streamlit as st
from streamlit_option_menu import option_menu

# Set page configuration
st.set_page_config(page_title="Health Assistant",
                   layout="wide",
                   page_icon="🧑‍⚕️")

    
# getting the working directory of the main.py
working_dir = os.path.dirname(os.path.abspath(__file__))

# loading the saved models

diabetes_model = pickle.load(open(f'{working_dir}/saved_models/diabetes_model.sav', 'rb'))

heart_disease_model = pickle.load(open(f'{working_dir}/saved_models/heart_disease_model.sav', 'rb'))

parkinsons_model = pickle.load(open(f'{working_dir}/saved_models/parkinsons_model.sav', 'rb'))

def parse_inputs(values):
    """Convert text inputs to floats; show an error and return None if any is blank or not a number."""
    try:
        return [float(x) for x in values]
    except ValueError:
        st.error('Please fill in every field with a valid number.')
        return None


# sidebar for navigation
with st.sidebar:
    selected = option_menu('Multiple Disease Prediction System',

                           ['Diabetes Prediction',
                            'Heart Disease Prediction',
                            'Parkinsons Prediction'],
                           menu_icon='hospital-fill',
                           icons=['activity', 'heart', 'person'],
                           default_index=0)


st.caption('Educational demo built on public datasets. Not a medical diagnosis tool.')

# Diabetes Prediction Page
if selected == 'Diabetes Prediction':

    # page title
    st.title('Diabetes Prediction using ML')

    # getting the input data from the user
    col1, col2, col3 = st.columns(3)

    with col1:
        Pregnancies = st.text_input('Number of Pregnancies', placeholder='0 – 17 (e.g. 3)',
                             help='Whole number. Dataset range: 0 – 17, typical: 0 – 10.')

    with col2:
        Glucose = st.text_input('Glucose Level', placeholder='44 – 199 (e.g. 117)',
                             help='Plasma glucose (mg/dL). Dataset range: 44 – 199, typical: 80 – 180.')

    with col3:
        BloodPressure = st.text_input('Blood Pressure value', placeholder='24 – 122 (e.g. 72)',
                             help='Diastolic blood pressure (mm Hg). Dataset range: 24 – 122, typical: 40 – 90.')

    with col1:
        SkinThickness = st.text_input('Skin Thickness value', placeholder='0 – 99 (e.g. 23)',
                             help='Triceps skin fold thickness (mm). Dataset range: 0 – 99, typical: 0 – 44. The dataset uses 0 when not measured.')

    with col2:
        Insulin = st.text_input('Insulin Level', placeholder='0 – 846 (e.g. 32)',
                             help='2-hour serum insulin (mu U/ml). Dataset range: 0 – 846, typical: 0 – 300. The dataset uses 0 when not measured.')

    with col3:
        BMI = st.text_input('BMI value', placeholder='18 – 67 (e.g. 32.0)',
                             help='Body mass index (kg/m²). Dataset range: 18.2 – 67.1, typical: 22 – 45.')

    with col1:
        DiabetesPedigreeFunction = st.text_input('Diabetes Pedigree Function value', placeholder='0.08 – 2.42 (e.g. 0.37)',
                             help='Diabetes family-history score. Dataset range: 0.078 – 2.42, typical: 0.14 – 1.1.')

    with col2:
        Age = st.text_input('Age of the Person', placeholder='21 – 81 (e.g. 29)',
                             help='Age in years. Dataset range: 21 – 81, typical: 21 – 58.')


    # code for Prediction
    diab_diagnosis = ''

    # creating a button for Prediction

    if st.button('Diabetes Test Result'):

        user_input = [Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin,
                      BMI, DiabetesPedigreeFunction, Age]

        user_input = parse_inputs(user_input)

        if user_input is not None:
            diab_prediction = diabetes_model.predict([user_input])

            if diab_prediction[0] == 1:
                diab_diagnosis = 'The model predicts: diabetic'
            else:
                diab_diagnosis = 'The model predicts: not diabetic'

    if diab_diagnosis:
        st.success(diab_diagnosis)

# Heart Disease Prediction Page
if selected == 'Heart Disease Prediction':

    # page title
    st.title('Heart Disease Prediction using ML')

    col1, col2, col3 = st.columns(3)

    with col1:
        age = st.text_input('Age', placeholder='29 – 77 (e.g. 55)',
                             help='Age in years. Dataset range: 29 – 77, typical: 39 – 68.')

    with col2:
        sex = st.text_input('Sex', placeholder='0 or 1',
                             help='0 = female, 1 = male.')

    with col3:
        cp = st.text_input('Chest Pain types', placeholder='0, 1, 2 or 3',
                             help='Chest pain type, a code from 0 to 3.')

    with col1:
        trestbps = st.text_input('Resting Blood Pressure', placeholder='94 – 200 (e.g. 130)',
                             help='Resting blood pressure (mm Hg). Dataset range: 94 – 200, typical: 108 – 160.')

    with col2:
        chol = st.text_input('Serum Cholestoral in mg/dl', placeholder='126 – 564 (e.g. 240)',
                             help='Serum cholesterol (mg/dl). Dataset range: 126 – 564, typical: 175 – 330.')

    with col3:
        fbs = st.text_input('Fasting Blood Sugar > 120 mg/dl', placeholder='0 or 1',
                             help='1 = fasting blood sugar is above 120 mg/dl, 0 = it is not.')

    with col1:
        restecg = st.text_input('Resting Electrocardiographic results', placeholder='0, 1 or 2',
                             help='Resting ECG result, a code from 0 to 2.')

    with col2:
        thalach = st.text_input('Maximum Heart Rate achieved', placeholder='71 – 202 (e.g. 153)',
                             help='Maximum heart rate achieved (bpm). Dataset range: 71 – 202, typical: 108 – 182.')

    with col3:
        exang = st.text_input('Exercise Induced Angina', placeholder='0 or 1',
                             help='1 = exercise induced angina, 0 = no.')

    with col1:
        oldpeak = st.text_input('ST depression induced by exercise', placeholder='0 – 6.2 (e.g. 0.8)',
                             help='ST depression induced by exercise relative to rest. Dataset range: 0 – 6.2, typical: 0 – 3.4.')

    with col2:
        slope = st.text_input('Slope of the peak exercise ST segment', placeholder='0, 1 or 2',
                             help='Slope of the peak exercise ST segment, a code from 0 to 2.')

    with col3:
        ca = st.text_input('Major vessels colored by flourosopy', placeholder='0 – 4 (e.g. 0)',
                             help='Number of major vessels coloured by fluoroscopy. Whole number from 0 to 4.')

    with col1:
        thal = st.text_input('thal: 0 = normal; 1 = fixed defect; 2 = reversable defect', placeholder='0, 1, 2 (dataset also has 3)',
                             help='Thalassemia code. The dataset contains values 0 – 3; the label lists 0, 1 and 2.')

    # code for Prediction
    heart_diagnosis = ''

    # creating a button for Prediction

    if st.button('Heart Disease Test Result'):

        user_input = [age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal]

        user_input = parse_inputs(user_input)

        if user_input is not None:
            heart_prediction = heart_disease_model.predict([user_input])

            if heart_prediction[0] == 1:
                heart_diagnosis = 'The model predicts: heart disease'
            else:
                heart_diagnosis = 'The model predicts: no heart disease'

    if heart_diagnosis:
        st.success(heart_diagnosis)

# Parkinson's Prediction Page
if selected == "Parkinsons Prediction":

    # page title
    st.title("Parkinson's Disease Prediction using ML")

    col1, col2, col3, col4, col5 = st.columns(5)

    with col1:
        fo = st.text_input('MDVP:Fo(Hz)', placeholder='88 – 260',
                             help='Average vocal fundamental frequency (Hz). Dataset range: 88.3 – 260.1, median: 148.8.')

    with col2:
        fhi = st.text_input('MDVP:Fhi(Hz)', placeholder='102 – 592',
                             help='Maximum vocal fundamental frequency (Hz). Dataset range: 102.1 – 592.0, median: 175.8.')

    with col3:
        flo = st.text_input('MDVP:Flo(Hz)', placeholder='65 – 239',
                             help='Minimum vocal fundamental frequency (Hz). Dataset range: 65.5 – 239.2, median: 104.3.')

    with col4:
        Jitter_percent = st.text_input('MDVP:Jitter(%)', placeholder='0.0017 – 0.033',
                             help='Variation in fundamental frequency (%). Dataset range: 0.00168 – 0.03316, median: 0.0049.')

    with col5:
        Jitter_Abs = st.text_input('MDVP:Jitter(Abs)', placeholder='0.000007 – 0.00026',
                             help='Absolute variation in fundamental frequency. Dataset range: 0.000007 – 0.00026, median: 0.00003.')

    with col1:
        RAP = st.text_input('MDVP:RAP', placeholder='0.0007 – 0.021',
                             help='Relative amplitude perturbation (jitter measure). Dataset range: 0.00068 – 0.02144, median: 0.0025.')

    with col2:
        PPQ = st.text_input('MDVP:PPQ', placeholder='0.0009 – 0.020',
                             help='Five-point period perturbation quotient (jitter measure). Dataset range: 0.00092 – 0.01958, median: 0.0027.')

    with col3:
        DDP = st.text_input('Jitter:DDP', placeholder='0.002 – 0.064',
                             help='Average absolute difference of differences between jitter cycles. Dataset range: 0.00204 – 0.06433, median: 0.0075.')

    with col4:
        Shimmer = st.text_input('MDVP:Shimmer', placeholder='0.0095 – 0.119',
                             help='Variation in amplitude. Dataset range: 0.00954 – 0.11908, median: 0.023.')

    with col5:
        Shimmer_dB = st.text_input('MDVP:Shimmer(dB)', placeholder='0.085 – 1.30',
                             help='Variation in amplitude (dB). Dataset range: 0.085 – 1.302, median: 0.22.')

    with col1:
        APQ3 = st.text_input('Shimmer:APQ3', placeholder='0.0046 – 0.056',
                             help='Three-point amplitude perturbation quotient. Dataset range: 0.00455 – 0.05647, median: 0.013.')

    with col2:
        APQ5 = st.text_input('Shimmer:APQ5', placeholder='0.0057 – 0.079',
                             help='Five-point amplitude perturbation quotient. Dataset range: 0.0057 – 0.0794, median: 0.013.')

    with col3:
        APQ = st.text_input('MDVP:APQ', placeholder='0.0072 – 0.138',
                             help='Eleven-point amplitude perturbation quotient. Dataset range: 0.00719 – 0.13778, median: 0.018.')

    with col4:
        DDA = st.text_input('Shimmer:DDA', placeholder='0.014 – 0.169',
                             help='Average absolute differences between consecutive amplitude differences. Dataset range: 0.01364 – 0.16942, median: 0.038.')

    with col5:
        NHR = st.text_input('NHR', placeholder='0.0007 – 0.315',
                             help='Noise-to-harmonics ratio. Dataset range: 0.00065 – 0.31482, median: 0.012.')

    with col1:
        HNR = st.text_input('HNR', placeholder='8.4 – 33.0',
                             help='Harmonics-to-noise ratio. Dataset range: 8.441 – 33.047, median: 22.1.')

    with col2:
        RPDE = st.text_input('RPDE', placeholder='0.257 – 0.685',
                             help='Recurrence period density entropy (nonlinear measure). Dataset range: 0.25657 – 0.685151, median: 0.496.')

    with col3:
        DFA = st.text_input('DFA', placeholder='0.574 – 0.825',
                             help='Detrended fluctuation analysis (signal fractal scaling exponent). Dataset range: 0.574282 – 0.825288, median: 0.722.')

    with col4:
        spread1 = st.text_input('spread1', placeholder='-7.96 to -2.43',
                             help='Nonlinear measure of fundamental frequency variation. Values are negative. Dataset range: -7.96498 to -2.43403, median: -5.72.')

    with col5:
        spread2 = st.text_input('spread2', placeholder='0.006 – 0.450',
                             help='Nonlinear measure of fundamental frequency variation. Dataset range: 0.006274 – 0.450493, median: 0.219.')

    with col1:
        D2 = st.text_input('D2', placeholder='1.42 – 3.67',
                             help='Correlation dimension (nonlinear measure). Dataset range: 1.42329 – 3.67116, median: 2.36.')

    with col2:
        PPE = st.text_input('PPE', placeholder='0.045 – 0.527',
                             help='Pitch period entropy (nonlinear measure). Dataset range: 0.044539 – 0.527367, median: 0.194.')

    # code for Prediction
    parkinsons_diagnosis = ''

    # creating a button for Prediction    
    if st.button("Parkinson's Test Result"):

        user_input = [fo, fhi, flo, Jitter_percent, Jitter_Abs,
                      RAP, PPQ, DDP,Shimmer, Shimmer_dB, APQ3, APQ5,
                      APQ, DDA, NHR, HNR, RPDE, DFA, spread1, spread2, D2, PPE]

        user_input = parse_inputs(user_input)

        if user_input is not None:
            parkinsons_prediction = parkinsons_model.predict([user_input])

            if parkinsons_prediction[0] == 1:
                parkinsons_diagnosis = "The model predicts: Parkinson's disease"
            else:
                parkinsons_diagnosis = "The model predicts: no Parkinson's disease"

    if parkinsons_diagnosis:
        st.success(parkinsons_diagnosis)
