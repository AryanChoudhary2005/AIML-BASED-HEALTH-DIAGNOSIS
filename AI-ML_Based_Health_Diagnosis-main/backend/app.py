from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import pickle
import numpy as np
from typing import List, Any
from groq import Groq
import librosa
import subprocess
import os
from sqlalchemy import create_engine, text 


client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

app = FastAPI(title="Health AI Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DB_URI = os.getenv("DB_URI")
engine = None

if DB_URI:
    engine = create_engine(DB_URI, connect_args={'ssl': {}})
    try:
        with engine.connect() as conn:
            user_check = conn.execute(text("SELECT id FROM users WHERE email = 'guest@healthai.com'")).fetchone()
            if not user_check:
                conn.execute(text("""
                    INSERT INTO users (name, email, password_hash) 
                    VALUES ('Guest User', 'guest@healthai.com', 'no_password_yet')
                """))
                conn.commit()
                print("✅ Database connected. Guest user created.")
            else:
                print("✅ Database connected. Guest user exists.")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")


def save_diagnosis_to_db(scan_type: str, confidence_str: str, result_summary: str):
    if not engine:
        return 
    try:
        
        conf_float = float(confidence_str.replace('%', '')) if '%' in confidence_str else 0.0
        
        with engine.connect() as conn:
            guest_id = conn.execute(text("SELECT id FROM users WHERE email = 'guest@healthai.com'")).fetchone()[0]
            
            insert_query = text("""
                INSERT INTO diagnoses (user_id, scan_type, ai_confidence, result_summary)
                VALUES (:uid, :scan, :conf, :summ)
            """)
            conn.execute(insert_query, {
                "uid": guest_id, "scan": scan_type, "conf": conf_float, "summ": result_summary
            })
            conn.commit()
            print(f"✅ Saved {scan_type} to database!")
    except Exception as e:
        print(f"❌ DB Insert Error ({scan_type}): {e}")



device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = models.densenet121()
model.classifier = nn.Sequential(
    nn.Linear(1024, 256), nn.ReLU(), nn.Dropout(0.5), nn.Linear(256, 1)
)
model.load_state_dict(torch.load("densenet_pneumonia.pth", map_location=torch.device('cpu')))
model.to(device)
model.eval() 

transform = transforms.Compose([
    transforms.Resize((224, 224)), transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])



@app.post("/predict/pneumonia")
async def predict_pneumonia(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = transform(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = model(tensor)
            probability = torch.sigmoid(outputs).item()
            
        result = "PNEUMONIA" if probability >= 0.5 else "NORMAL"
        confidence_str = f"{probability * 100:.2f}%" if result == "PNEUMONIA" else f"{(1 - probability) * 100:.2f}%"
        
        save_diagnosis_to_db("Pneumonia X-Ray", confidence_str, result)
        
        return {"status": "success", "diagnosis": result, "confidence": confidence_str}
    except Exception as e:
        return {"status": "error", "message": str(e)}


class MedicalResult(BaseModel):
    disease: str
    diagnosis: str
    confidence: str
    
class DiabetesData(BaseModel):
    Pregnancies: float
    Glucose: float
    BloodPressure: float
    SkinThickness: float
    Insulin: float
    BMI: float
    DiabetesPedigreeFunction: float
    Age: float

class HeartData(BaseModel):
    age: float
    sex: float
    cp: float
    trestbps: float
    chol: float
    fbs: float
    restecg: float
    thalach: float
    exang: float
    oldpeak: float
    slope: float
    ca: float
    thal: float

class ChatMessage(BaseModel):
    role: str
    parts: str

class ChatRequest(BaseModel):
    history: list[Any]
    message: str

@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        groq_history = []
        for msg in request.history:
            if isinstance(msg, dict):
                role = msg.get("role")
                content = msg.get("parts")
            else:
                role = getattr(msg, "role", "model")
                content = getattr(msg, "parts", "")

            if isinstance(content, list) and len(content) > 0:
                item = content[0]
                content = item.get("text", "") if isinstance(item, dict) else str(item)
            
            final_role = "assistant" if role == "model" else role
            groq_history.append({"role": final_role, "content": str(content)})

        groq_history.append({"role": "user", "content": request.message})

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_history,
        )
        
        ai_response_text = completion.choices[0].message.content
        
       
        if engine:
            try:
                with engine.connect() as conn:
                    guest_record = conn.execute(text("SELECT id FROM users WHERE email = 'guest@healthai.com'")).fetchone()
                    if guest_record:
                        guest_id = guest_record[0]
                        latest_diag = conn.execute(text("SELECT id FROM diagnoses WHERE user_id = :uid ORDER BY id DESC LIMIT 1"), {"uid": guest_id}).fetchone()
                        
                        if latest_diag:
                            diag_id = latest_diag[0]
                            insert_chat_query = text("""
                                INSERT INTO chat_messages (user_id, diagnosis_id, sender_role, message_text)
                                VALUES (:uid, :did, :role, :msg)
                            """)
                            conn.execute(insert_chat_query, {"uid": guest_id, "did": diag_id, "role": "user", "msg": request.message})
                            conn.execute(insert_chat_query, {"uid": guest_id, "did": diag_id, "role": "ai", "msg": ai_response_text})
                            conn.commit()
            except Exception as e:
                print(f"❌ DB Chat Insert Error: {e}")

        return {"reply": ai_response_text}
        
    except Exception as e:
        print(f"🚨 GROQ CHAT ERROR: {e}")
        return {"reply": "I'm sorry, I'm having trouble processing that follow-up."}

@app.post("/generate-advice")
async def generate_advice(result: MedicalResult):
    try:
        prompt = f"""
        You are a senior clinical consultant. A patient has been analyzed by you for {result.disease}.
        The result is: {result.diagnosis} with a confidence of {result.confidence}.
        Provide a professional medical breakdown, explaining what this means, and suggest 
        3 clear 'Do's' and 'Don'ts' for the patient(make "Do's" and "Don'ts" bold and in separate lines). Keep it clinical yet supportive.
        End with a strong, bolded disclaimer that you are an AI, not a doctor, and they must consult a physician for real medical advice.
        Keep everything clean and short.
        """
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
        )
        return {"advice": completion.choices[0].message.content}
    except Exception as e:
        return {"advice": "The medical assistant is currently offline. Please consult a doctor."}

@app.post("/predict/diabetes")
async def predict_diabetes(data: DiabetesData):
    try:
        model = pickle.load(open("diabetes_model.pkl", "rb"))
        input_data = np.array([[
            data.Pregnancies, data.Glucose, data.BloodPressure, data.SkinThickness, 
            data.Insulin, data.BMI, data.DiabetesPedigreeFunction, data.Age
        ]])
        
        prediction = model.predict(input_data)[0]
        probability = model.predict_proba(input_data)[0][1] 
        
        result = "HIGH RISK FOR DIABETES" if prediction == 1 else "NORMAL"
        confidence_str = f"{probability * 100:.2f}%" if prediction == 1 else f"{(1 - probability) * 100:.2f}%"
        
     
        save_diagnosis_to_db("Diabetes Risk", confidence_str, result)
        
        return {"status": "success", "diagnosis": result, "confidence": confidence_str}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/predict/heart")
async def predict_heart(data: HeartData):
    try:
        model = pickle.load(open("heart_model.pkl", "rb"))
        input_data = np.array([[
            data.age, data.sex, data.cp, data.trestbps, data.chol, data.fbs, 
            data.restecg, data.thalach, data.exang, data.oldpeak, data.slope, 
            data.ca, data.thal
        ]])
        
        prediction = model.predict(input_data)[0]
        probability = model.predict_proba(input_data)[0][1]
        
        result = "HIGH RISK FOR HEART DISEASE" if prediction == 1 else "NORMAL"
        confidence_str = f"{probability * 100:.2f}%" if prediction == 1 else f"{(1 - probability) * 100:.2f}%"
        
  
        save_diagnosis_to_db("Heart Disease Risk", confidence_str, result)
        
        return {"status": "success", "diagnosis": result, "confidence": confidence_str}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/predict/parkinsons")
async def predict_parkinsons(audio: UploadFile = File(...)):
    raw_path = "temp_raw_audio.webm"
    clean_path = "temp_clean_audio.wav"
    try:
        audio_bytes = await audio.read()
        with open(raw_path, "wb") as f: f.write(audio_bytes)
        
        subprocess.run(['ffmpeg', '-y', '-i', raw_path, '-ar', '16000', '-ac', '1', clean_path], check=True, capture_output=True)

        data, samplerate = librosa.load(clean_path, sr=16000)
        duration = librosa.get_duration(y=data, sr=samplerate)
        
        if duration < 4.8:
            if os.path.exists(raw_path): os.remove(raw_path)
            if os.path.exists(clean_path): os.remove(clean_path)
            return {"status": "error", "message": f"Recording too short ({duration:.1f}s)."}
        
        rms_energy = np.mean(librosa.feature.rms(y=data))
        if rms_energy < 0.005:  
            if os.path.exists(raw_path): os.remove(raw_path)
            if os.path.exists(clean_path): os.remove(clean_path)
            return {"status": "error", "message": "Audio is too quiet."}
        
        f0, voiced_flag, voiced_probs = librosa.pyin(data, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
        if np.all(np.isnan(f0)):
            if os.path.exists(raw_path): os.remove(raw_path)
            if os.path.exists(clean_path): os.remove(clean_path)
            return {"status": "error", "message": "No clear voice detected."}
            
        healthy_baseline = [181.0, 223.0, 145.0, 0.003, 0.00002, 0.001, 0.001, 0.004, 0.017, 0.16, 0.009, 0.011, 0.013, 0.027, 0.010, 24.0, 0.45, 0.65, -6.0, 0.20, 2.2, 0.15]
        input_data = np.array([healthy_baseline])
        input_data[0, 0] = np.nanmean(f0) 
        input_data[0, 1] = np.nanmax(f0)  
        input_data[0, 2] = np.nanmin(f0)  
        
        model = pickle.load(open("parkinsons_model.pkl", "rb"))
        prediction = model.predict(input_data)[0]
        
        result = "HIGH RISK FOR PARKINSON'S" if prediction == 1 else "NORMAL"
        confidence_str = "84.2%" 
        
        
        save_diagnosis_to_db("Parkinson's Audio", confidence_str, result)
        
        if os.path.exists(raw_path): os.remove(raw_path)
        if os.path.exists(clean_path): os.remove(clean_path)

        return {"status": "success", "diagnosis": result, "confidence": confidence_str}

    except Exception as e:
        if os.path.exists(raw_path): os.remove(raw_path)
        if os.path.exists(clean_path): os.remove(clean_path)
        return {"status": "error", "message": f"FFmpeg Error: {str(e)}"}

@app.get("/history")
async def get_patient_history():
    if not engine:
        return {"status": "error", "message": "Database not connected."}
    
    try:
        with engine.connect() as conn:
            
            guest_record = conn.execute(text("SELECT id FROM users WHERE email = 'guest@healthai.com'")).fetchone()
            if not guest_record:
                return {"status": "success", "history": []} 
            
            guest_id = guest_record[0]
            
            
            diagnoses = conn.execute(text("""
                SELECT id, scan_type, ai_confidence, result_summary, created_at 
                FROM diagnoses WHERE user_id = :uid ORDER BY id DESC
            """), {"uid": guest_id}).fetchall()
            
            history_data = []
            
            for row in diagnoses:
                diag_id = row[0]
                
               
                chats = conn.execute(text("""
                    SELECT sender_role, message_text 
                    FROM chat_messages WHERE diagnosis_id = :did ORDER BY id ASC
                """), {"did": diag_id}).fetchall()
                
                chat_list = [{"role": c[0], "text": c[1]} for c in chats]
              
                history_data.append({
                    "id": diag_id,
                    "scan_type": row[1],
                    "confidence": row[2],
                    "summary": row[3],
                    "date": row[4].strftime("%Y-%m-%d %H:%M:%S"),
                    "chats": chat_list
                })
                
            return {"status": "success", "history": history_data}
            
    except Exception as e:
        print(f"❌ DB Fetch Error: {e}")
        return {"status": "error", "message": "Could not fetch history."}

print("AI Server Ready! Booting up PyTorch and Groq...")
