import React, { useState } from 'react';

const DataForm = ({ diseaseId, onSubmit, disabled }) => {
  
  const formFields = {
    diabetes: [
      { name: 'Pregnancies', label: 'Pregnancies', type: 'number', placeholder: 'e.g., 0' },
      { name: 'Glucose', label: 'Glucose Level', type: 'number', placeholder: 'e.g., 120' },
      { name: 'BloodPressure', label: 'Blood Pressure (mm Hg)', type: 'number', placeholder: 'e.g., 70' },
      { name: 'SkinThickness', label: 'Skin Thickness (mm)', type: 'number', placeholder: 'e.g., 20' },
      { name: 'Insulin', label: 'Insulin (mu U/ml)', type: 'number', placeholder: 'e.g., 85' },
      { name: 'BMI', label: 'BMI', type: 'number', step: '0.1', placeholder: 'e.g., 25.5' },
      { name: 'DiabetesPedigreeFunction', label: 'Diabetes Pedigree', type: 'number', step: '0.01', placeholder: 'e.g., 0.52' },
      { name: 'Age', label: 'Age', type: 'number', placeholder: 'e.g., 45' }
    ],
    heart: [
      { name: 'age', label: 'Age', type: 'number', placeholder: 'e.g., 55' },
      { name: 'sex', label: 'Sex (1=Male, 0=Female)', type: 'number', placeholder: '1 or 0' },
      { name: 'cp', label: 'Chest Pain Type (0-3)', type: 'number', placeholder: 'e.g., 2' },
      { name: 'trestbps', label: 'Resting Blood Pressure', type: 'number', placeholder: 'e.g., 130' },
      { name: 'chol', label: 'Cholesterol (mg/dl)', type: 'number', placeholder: 'e.g., 240' },
      { name: 'fbs', label: 'Fasting Blood Sugar > 120 (1=True)', type: 'number', placeholder: '1 or 0' },
      { name: 'restecg', label: 'Resting ECG Results (0-2)', type: 'number', placeholder: 'e.g., 1' },
      { name: 'thalach', label: 'Max Heart Rate', type: 'number', placeholder: 'e.g., 150' },
      { name: 'exang', label: 'Exercise Induced Angina (1=Yes)', type: 'number', placeholder: '1 or 0' },
      { name: 'oldpeak', label: 'ST Depression (Oldpeak)', type: 'number', step: '0.1', placeholder: 'e.g., 1.5' },
      { name: 'slope', label: 'Slope of Peak ST Segment (0-2)', type: 'number', placeholder: 'e.g., 1' },
      { name: 'ca', label: 'Number of Major Vessels (0-3)', type: 'number', placeholder: 'e.g., 0' },
      { name: 'thal', label: 'Thalassemia (1=Normal, 2=Fixed, 3=Revers.)', type: 'number', placeholder: 'e.g., 2' }
    ]
  };

  const currentFields = formFields[diseaseId] || [];
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentFields.map((field) => (
          <div key={field.name} className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-1">{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              step={field.step || "1"}
              required
              placeholder={field.placeholder}
              onChange={handleChange}
              disabled={disabled}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-100"
            />
          </div>
        ))}
      </div>
      <button 
        type="submit" 
        disabled={disabled}
        className={`w-full py-4 mt-6 rounded-xl font-bold text-white transition ${
          disabled ? "bg-slate-300 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700 shadow-lg"
        }`}
      >
        {disabled ? "Processing Data..." : "Analyze Patient Vitals"}
      </button>
    </form>
  );
};

export default DataForm;
