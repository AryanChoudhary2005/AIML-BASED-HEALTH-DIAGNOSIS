import React from 'react';
import { Activity, Droplet, HeartPulse, Mic } from 'lucide-react';


const diseases = [
  {
    id: 'pneumonia',
    title: 'Pneumonia Detector',
    description: 'Upload a chest X-ray to detect viral or bacterial pneumonia using our DenseNet121 computer vision model.',
    icon: <Activity className="w-8 h-8 text-blue-500" />,
    color: 'bg-blue-50',
    borderColor: 'hover:border-blue-400',
    inputType: 'X-Ray Image'
  },
  {
    id: 'diabetes',
    title: 'Diabetes Predictor',
    description: 'Enter patient vitals and lab results to assess the risk of diabetes using predictive analytics.',
    icon: <Droplet className="w-8 h-8 text-teal-500" />,
    color: 'bg-teal-50',
    borderColor: 'hover:border-teal-400',
    inputType: 'Medical Data'
  },
  {
    id: 'heart',
    title: 'Heart Disease Analyzer',
    description: 'Analyze cardiovascular parameters to detect the presence of heart disease with high accuracy.',
    icon: <HeartPulse className="w-8 h-8 text-red-500" />,
    color: 'bg-red-50',
    borderColor: 'hover:border-red-400',
    inputType: 'Medical Data'
  },
  {
    id: 'parkinsons',
    title: 'Parkinson\'s Classifier',
    description: 'Record a 5-second voice sample to detect acoustic micro-tremors associated with Parkinson\'s disease.',
    icon: <Mic className="w-8 h-8 text-purple-500" />,
    color: 'bg-purple-50',
    borderColor: 'hover:border-purple-400',
    inputType: 'Voice Audio'
  }
];

const DiseaseGrid = ({ onSelectDisease }) => {
  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {diseases.map((disease) => (
          <div 
            key={disease.id}
            onClick={() => onSelectDisease(disease)}
            className={`flex flex-col p-6 rounded-2xl bg-white border-2 border-transparent shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer ${disease.borderColor}`}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className={`p-3 rounded-xl ${disease.color}`}>
                {disease.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{disease.title}</h3>
            </div>
            
            <p className="text-gray-600 flex-grow mb-6 leading-relaxed">
              {disease.description}
            </p>
            
            <div className="flex items-center justify-between mt-auto">
              <span className="text-sm font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                Input: {disease.inputType}
              </span>
              <span className="text-sm font-bold text-blue-600 flex items-center group-hover:translate-x-1 transition-transform">
                Launch Tool →
              </span>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};

export default DiseaseGrid;
