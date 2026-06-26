import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import pickle

print("🚀 Starting Detailed Clinical Evaluation...\n")

def evaluate_and_save(X, y, model_name, file_name):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    # Calculate Matrix
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    
    print(f"--------------------------------------------------")
    print(f"📊 {model_name.upper()} CLINICAL REPORT")
    print(f"--------------------------------------------------")
    print(f"Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")
    print(f"True Positives (Correctly diagnosed sick): {tp}")
    print(f"True Negatives (Correctly diagnosed healthy): {tn}")
    print(f"False Positives (False Alarms): {fp}")
    print(f"False Negatives (Missed cases): {fn}")
    print("\nFull Classification Report:")
    print(classification_report(y_test, y_pred))
    
    pickle.dump(model, open(file_name, "wb"))
    print(f"✅ {file_name} saved.\n")

# Run for Diabetes
try:
    df_diabetes = pd.read_csv("diabetes.csv")
    X_d = df_diabetes[['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age']]
    y_d = df_diabetes['Outcome']
    evaluate_and_save(X_d, y_d, "Diabetes", "diabetes_model.pkl")
except Exception as e: print(f"Error Diabetes: {e}")

# Run for Heart
try:
    df_heart = pd.read_csv("heart.csv")
    X_h = df_heart[['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']]
    y_h = df_heart['target']
    evaluate_and_save(X_h, y_h, "Heart Disease", "heart_model.pkl")


except Exception as e: print(f"Error Heart: {e}")

# --- PARKINSONS MODEL ---
try:
    # You can download 'parkinsons.data' from UCI Machine Learning Repository
    df_park = pd.read_csv("parkinsons.csv")
    # Features: MDVP:Fo(Hz), MDVP:Fhi(Hz), MDVP:Flo(Hz), Jitter, Shimmer, etc.
    X_p = df_park.drop(['name', 'status'], axis=1)
    y_p = df_park['status']
    
    evaluate_and_save(X_p, y_p, "Parkinson's", "parkinsons_model.pkl")
except Exception as e: print(f"Error Parkinson's: {e}")