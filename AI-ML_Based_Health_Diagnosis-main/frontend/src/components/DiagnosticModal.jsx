import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, UploadCloud, Activity, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import DataForm from './DataForm';
import AudioRecorder from './AudioRecorder';

const DiagnosticModal = ({ disease, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [audioMode, setAudioMode] = useState('record');

  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  
  useEffect(() => {
    scrollToBottom();
  }, [messages, chatLoading]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setDiagnosis(null);
      setMessages([]);
    }
  };

  //handles follow-up questions ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = { role: 'user', parts: userInput };
    const updatedHistory = [...messages, userMsg];
    
    setMessages(updatedHistory);
    setUserInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: messages, //send existing history
          message: userMsg.parts //send new message
        })
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', parts: data.reply }]);
    } catch (error) {
      console.error("Chat failed", error);
      setMessages(prev => [...prev, { role: 'model', parts: "I'm sorry, I'm having trouble connecting to my brain." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAnalyze = async (formData = null) => {
    setLoading(true);
    setMessages([]); //clear chat for new analysis

    if (disease.id === 'pneumonia' || disease.id === 'parkinsons') {
      if (!selectedFile) return;
      const dataPayload = new FormData();
      
      
      if (disease.id === 'parkinsons') {
        dataPayload.append("audio", selectedFile); 
      } else {
        dataPayload.append("file", selectedFile);  
      }
      
      const endpoint = disease.id === 'parkinsons' ? "/predict/parkinsons" : "/predict/pneumonia";
      
      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          body: dataPayload,
        });
        const data = await response.json();
        setDiagnosis(data);
        setLoading(false);

        if (data.status === "success") {
          setChatLoading(true);
          const chatRes = await fetch(`${API_URL}/generate-advice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              disease: disease.title,
              diagnosis: data.diagnosis,
              confidence: data.confidence
            })
          });
          const chatData = await chatRes.json();
          setMessages([{ role: 'model', parts: chatData.advice }]);
        }
      } catch (error) {
        setDiagnosis({ status: "error", message: "Backend connection failed." });
        setLoading(false);
      } finally {
        setChatLoading(false);
      }
    } 
    else if (disease.id === 'diabetes' || disease.id === 'heart') {
      try {
        const endpoint = disease.id === 'diabetes' ? '/predict/diabetes' : '/predict/heart';
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        setDiagnosis(data);
        setLoading(false);

        if (data.status === "success") {
          setChatLoading(true);
          const chatRes = await fetch(`${API_URL}/generate-advice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              disease: disease.title,
              diagnosis: data.diagnosis,
              confidence: data.confidence
            })
          });
          const chatData = await chatRes.json();
          setMessages([{ role: 'model', parts: chatData.advice }]);
        }
      } catch (error) {
        setDiagnosis({ status: "error", message: "Backend connection failed." });
        setLoading(false);
      } finally {
        setChatLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 animate-in fade-in duration-300">
      <button onClick={onClose} className="flex items-center text-slate-500 hover:text-blue-600 font-semibold mb-6 transition">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </button> 

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        
        
        <div className="w-full md:w-1/2 p-8 border-r border-slate-100">
          <div className="flex items-center space-x-4 mb-6">
            <div className={`p-3 rounded-xl ${disease.color}`}>{disease.icon}</div>
            <h2 className="text-3xl font-bold text-slate-800">{disease.title}</h2>
          </div>
          <p className="text-slate-600 mb-8">{disease.description}</p>

          
          {disease.id === 'pneumonia' ? (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition relative group cursor-pointer">
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2 group-hover:text-blue-500 transition" />
                <p className="text-sm text-slate-600 font-medium">Click or drag X-Ray to upload</p>
              </div>
              {preview && <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg shadow-sm" />}
            </div>
          ) 
          
          
          : disease.id === 'diabetes' || disease.id === 'heart' ? (
            <DataForm 
              diseaseId={disease.id} 
              onSubmit={(data) => handleAnalyze(data)} 
              disabled={loading || chatLoading} 
            />
          ) 
          
          
          
          : disease.id === 'parkinsons' ? (
            <div className="space-y-6">
              
              
              <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
                <button 
                  onClick={() => {setAudioMode('record'); setSelectedFile(null); setPreview(null);}} 
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
                    audioMode === 'record' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Record Live
                </button>
                <button 
                  onClick={() => {setAudioMode('upload'); setSelectedFile(null); setPreview(null);}} 
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
                    audioMode === 'upload' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Upload File
                </button>
              </div>

              
              {audioMode === 'record' ? (
                <AudioRecorder onRecordingComplete={(blob) => setSelectedFile(blob)} />
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition relative group cursor-pointer bg-white">
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={handleFileChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2 group-hover:text-blue-500 transition" />
                    <p className="text-sm text-slate-600 font-medium">Click or drag Audio File to upload</p>
                    <p className="text-xs text-slate-400 mt-2">Supports MP3, WAV, M4A, OGG</p>
                  </div>

                  
                  {preview && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Selected File</p>
                      <audio src={preview} controls className="w-full" />
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-400 italic text-center px-4">
                Provide a clear, 5-second recording of the patient saying "Ahh" steadily for the best frequency analysis.
              </p>
            </div>
          ) 
          
          
          : (
            <div className="p-8 bg-slate-50 rounded-xl text-center border border-slate-200">
              <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 font-medium">Model configuration missing.</p>
            </div>
          )}

          
          {(disease.id === 'pneumonia' || disease.id === 'parkinsons') && (
            <button 
              onClick={() => handleAnalyze()} 
              disabled={loading || chatLoading || !selectedFile}
              className={`mt-8 w-full py-4 rounded-xl font-bold text-white transition ${
                loading || chatLoading || !selectedFile 
                  ? "bg-slate-300 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 shadow-lg"
              }`}
            >
              {loading ? "Analyzing..." : chatLoading ? "Generating Report..." : `Run ${disease.title} AI`}
            </button>
          )}
        </div>

        
        <div className="w-full md:w-1/2 bg-slate-50 flex flex-col h-[600px] md:h-[800px] border-l border-slate-100">
          <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Medical Consultation</h3>
            
            {diagnosis && diagnosis.status === "success" && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                diagnosis?.diagnosis?.includes("NORMAL") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                Live Analysis
              </span>
            )}
          </div>

          {!diagnosis ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Bot className="w-16 h-16 mb-4 opacity-10" />
              <p className="max-w-xs">Upload patient data and run the AI to begin your consultation.</p>
            </div>
          ) : diagnosis.status === "error" ? (
            
           
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
              <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 max-w-sm">
                <Activity className="w-10 h-10 mx-auto mb-3 text-red-500" />
                <h4 className="font-bold text-lg mb-2">Analysis Failed</h4>
                <p className="text-sm opacity-80">{diagnosis.message}</p>
              </div>
            </div>

          ) : (
            
            
            <>
              <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                <div className={`p-5 rounded-2xl border-2 shadow-sm animate-in slide-in-from-top duration-500 ${
                  diagnosis?.diagnosis?.includes("NORMAL") ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Current Finding</p>
                      
                      <h4 className={`text-2xl font-black ${
                        diagnosis?.diagnosis?.includes("NORMAL") ? "text-green-800" : "text-red-800"
                      }`}>
                        {diagnosis.diagnosis}
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">AI Confidence</p>
                      <p className="text-lg font-bold text-slate-700">{diagnosis.confidence}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                      }`}>
                        {msg.role === 'model' && (
                          <div className="flex items-center space-x-2 mb-2 opacity-50 border-b pb-1">
                            <Bot className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">AI Assistant</span>
                          </div>
                        )}
                        <div className="prose prose-sm max-w-none prose-slate leading-relaxed">
                          <ReactMarkdown>{msg.parts}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none flex items-center shadow-sm">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                        <span className="text-sm text-slate-400 italic">Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    disabled={chatLoading}
                    className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !userInput.trim()}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition active:scale-95 disabled:bg-slate-300"
                  >
                    <Activity className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticModal;
